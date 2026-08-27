import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CalendarCheck2, Clock3, LogIn, LogOut, Search, UserCheck, Users } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { saveAttendance, subscribeToAttendance } from '../services/attendanceService'
import { subscribeToWorkspaceMembers } from '../services/workspaceService'
import type { AttendanceRecord, AttendanceStatus } from '../types/attendance'
import type { WorkspaceMember } from '../types/workspace'

const statuses: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'half-day', label: 'Half day' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
]

const statusStyles: Record<AttendanceStatus, string> = {
  present: 'bg-[var(--os-success-soft)] text-[var(--os-success)]',
  late: 'bg-[var(--os-warning-soft)] text-[var(--os-warning)]',
  'half-day': 'bg-[var(--os-info-soft)] text-[var(--os-info)]',
  absent: 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]',
  leave: 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]',
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthBounds(value: string) {
  const [year, month] = value.split('-').map(Number)
  const last = new Date(year, month, 0).getDate()
  return { start: `${value}-01`, end: `${value}-${String(last).padStart(2, '0')}` }
}

function daysInMonth(value: string) {
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

function weekdayOffset(value: string) {
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).getDay()
}

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function timeLabel(value?: Date) {
  return value && value.getTime() > 0 ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
}

function hoursBetween(a?: Date, b?: Date) {
  if (!a || !b) return '—'
  const minutes = Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000))
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function Attendance() {
  const { user } = useAuth()
  const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const workspaceId = workspace?.id
  const userId = user?.uid
  const canManage = hasPermission('attendance.manage')
  const canView = hasPermission('attendance.view')
  const today = dateKey()

  const [month, setMonth] = useState(today.slice(0, 7))
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [note, setNote] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const bounds = useMemo(() => monthBounds(month), [month])

  useEffect(() => {
    if (workspaceLoading || !workspaceId || !userId || !canView) return undefined
    return subscribeToAttendance(workspaceId, bounds.start, bounds.end, canManage, userId, setRecords, (err) => setError(err.message))
  }, [workspaceId, workspaceLoading, userId, canView, canManage, bounds.start, bounds.end])

  useEffect(() => {
    if (!workspaceId || !canManage) return undefined
    return subscribeToWorkspaceMembers(workspaceId, setMembers, (err) => setError(err.message))
  }, [workspaceId, canManage])

  useEffect(() => {
    if (!selectedDate.startsWith(month)) setSelectedDate(bounds.start)
  }, [month, selectedDate, bounds.start])

  const targetUserId = canManage ? selectedUser || members[0]?.userId || '' : userId || ''
  const myToday = records.find((item) => item.userId === userId && item.date === today)
  const selectedRecord = records.find((item) => item.userId === targetUserId && item.date === selectedDate)

  useEffect(() => {
    if (!selectedRecord) return
    setStatus(selectedRecord.status)
    setNote(selectedRecord.note ?? '')
  }, [selectedRecord?.id])

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((item) => {
      const person = members.find((member) => member.userId === item.userId)
      const text = `${person?.displayName ?? ''} ${person?.email ?? ''} ${item.date} ${item.status}`.toLowerCase()
      return !query || text.includes(query)
    })
  }, [records, members, search])

  const presentCount = records.filter((item) => item.status === 'present').length
  const lateCount = records.filter((item) => item.status === 'late').length
  const leaveCount = records.filter((item) => item.status === 'leave').length
  const absentCount = records.filter((item) => item.status === 'absent').length
  const checkedOutCount = records.filter((item) => Boolean(item.checkOut)).length
  const calendarDays = useMemo(() => {
    const offset = weekdayOffset(month)
    return Array.from({ length: offset + daysInMonth(month) }, (_, index) => index < offset ? null : index - offset + 1)
  }, [month])

  function calendarRecord(day: number) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    return records.find((item) => item.userId === targetUserId && item.date === date)
  }

  function shiftMonth(delta: number) {
    const [year, currentMonth] = month.split('-').map(Number)
    const next = new Date(year, currentMonth - 1 + delta, 1)
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    setMonth(nextMonth)
    setSelectedDate(`${nextMonth}-01`)
  }

  async function save(target: string, date: string, nextStatus: AttendanceStatus, checkIn?: Date, checkOut?: Date, nextNote?: string) {
    if (!workspaceId || !userId || !target) return
    setSaving(true)
    setError('')
    try {
      await saveAttendance({ workspaceId, userId: target, date, status: nextStatus, markedBy: userId, checkIn, checkOut, note: nextNote })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance.')
    } finally {
      setSaving(false)
    }
  }

  async function checkIn() {
    await save(userId || '', today, 'present', new Date(), myToday?.checkOut, myToday?.note)
  }

  async function checkOut() {
    await save(userId || '', today, myToday?.status ?? 'present', myToday?.checkIn, new Date(), myToday?.note)
  }

  async function managerSave() {
    await save(targetUserId, selectedDate, status, selectedRecord?.checkIn, selectedRecord?.checkOut, note)
  }

  if (!canView) {
    return <div className="mx-auto w-full max-w-[1400px] p-6"><Card className="p-8 text-center"><p className="text-sm text-[var(--os-text-secondary)]">You do not have permission to view attendance.</p></Card></div>
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Operations</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Attendance</h1>
          <p className="mt-2 text-sm text-[var(--os-text-secondary)]">Realtime attendance, workforce insights and a visual monthly calendar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => shiftMonth(-1)} className="os-focus-ring h-10 rounded-xl border border-[var(--os-border)] px-3 text-sm">←</button>
          <input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setSelectedDate(`${event.target.value}-01`) }} className="os-focus-ring h-10 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm" />
          <button type="button" onClick={() => shiftMonth(1)} className="os-focus-ring h-10 rounded-xl border border-[var(--os-border)] px-3 text-sm">→</button>
          <button type="button" onClick={() => { setMonth(today.slice(0, 7)); setSelectedDate(today) }} className="os-focus-ring h-10 rounded-xl border border-[var(--os-border)] px-3 text-sm">Today</button>
        </div>
      </header>

      {error && <div role="alert" className="mt-5 rounded-xl border border-[var(--os-danger)]/20 bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<CalendarCheck2 size={18} />} label="My status today" value={myToday?.status ? statuses.find((item) => item.value === myToday.status)?.label ?? myToday.status : 'Not marked'} />
        <Stat icon={<Clock3 size={18} />} label="My check-in" value={timeLabel(myToday?.checkIn)} />
        <Stat icon={<UserCheck size={18} />} label="Present / late" value={`${presentCount} / ${lateCount}`} />
        <Stat icon={<Users size={18} />} label="Leave / absent" value={`${leaveCount} / ${absentCount}`} />
        <Stat icon={<Clock3 size={18} />} label="Checked out" value={String(checkedOutCount)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--os-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-sm font-semibold text-[var(--os-text)]">Attendance calendar</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">{monthLabel(month)} · click a date to inspect or mark attendance.</p></div>
              {canManage && <select value={targetUserId} onChange={(event) => setSelectedUser(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-xs sm:w-64"><option value="">Select member</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName || member.email || member.userId}</option>)}</select>}
            </div>
            <div className="p-4 sm:p-5">
              <div className="mb-3 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-2">{day}</div>)}</div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, index) => day === null ? <div key={`empty-${index}`} className="min-h-20 rounded-xl" /> : <CalendarCell key={day} day={day} date={`${month}-${String(day).padStart(2, '0')}`} today={today} selected={selectedDate === `${month}-${String(day).padStart(2, '0')}`} record={calendarRecord(day)} onClick={() => setSelectedDate(`${month}-${String(day).padStart(2, '0')}`)} />)}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[var(--os-text-muted)]">{statuses.map((item) => <span key={item.value} className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${item.value === 'present' ? 'bg-[var(--os-success)]' : item.value === 'late' ? 'bg-[var(--os-warning)]' : item.value === 'absent' ? 'bg-[var(--os-danger)]' : 'bg-[var(--os-accent)]`} />{item.label}</span>)}</div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--os-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-sm font-semibold text-[var(--os-text)]">Monthly attendance log</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">{visibleRecords.length} visible records · live updates</p></div>
              <div className="relative w-full sm:w-72"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member, date or status" className="os-focus-ring h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-9 pr-3 text-xs" /></div>
            </div>
            {visibleRecords.length === 0 ? <div className="p-10 text-center text-sm text-[var(--os-text-secondary)]">No attendance records for this month.</div> : <div className="divide-y divide-[var(--os-border)]">{visibleRecords.map((record) => { const person = members.find((member) => member.userId === record.userId); return <button type="button" key={record.id} onClick={() => { setSelectedDate(record.date); if (canManage) setSelectedUser(record.userId) }} className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-[var(--os-surface-hover)] sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--os-text)]">{person?.displayName || person?.email || record.userId}</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">{record.date} · {timeLabel(record.checkIn)} → {timeLabel(record.checkOut)} · {hoursBetween(record.checkIn, record.checkOut)}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[record.status]}`}>{statuses.find((item) => item.value === record.status)?.label ?? record.status}</span></button> })}</div>}
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-5 xl:self-start">
          {!canManage && <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Today</p><h2 className="mt-2 text-lg font-semibold text-[var(--os-text)]">Your attendance</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">Record your check-in and check-out for today.</p><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><Button type="button" onClick={() => void checkIn()} disabled={saving || Boolean(myToday?.checkIn)}><LogIn size={15} />{myToday?.checkIn ? `Checked in ${timeLabel(myToday.checkIn)}` : 'Check in'}</Button><Button type="button" variant="secondary" onClick={() => void checkOut()} disabled={saving || !myToday?.checkIn || Boolean(myToday?.checkOut)}><LogOut size={15} />{myToday?.checkOut ? `Checked out ${timeLabel(myToday.checkOut)}` : 'Check out'}</Button></div>{myToday?.checkIn && myToday?.checkOut && <div className="mt-4 rounded-xl bg-[var(--os-surface-hover)] p-3 text-xs text-[var(--os-text-secondary)]">Worked today: <strong className="text-[var(--os-text)]">{hoursBetween(myToday.checkIn, myToday.checkOut)}</strong></div>}</Card>}

          {canManage && <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Manager controls</p><h2 className="mt-2 text-lg font-semibold text-[var(--os-text)]">Mark attendance</h2><div className="mt-4 space-y-4"><label className="block"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">Member</span><select value={targetUserId} onChange={(event) => setSelectedUser(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm">{members.length === 0 && <option value="">No active members</option>}{members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName || member.email || member.userId}</option>)}</select></label><label className="block"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">Selected date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm" /></label><label className="block"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus)} className="mt-1 h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm">{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">Note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Optional attendance note..." className="mt-1 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2 text-sm" /></label><Button type="button" onClick={() => void managerSave()} disabled={saving || !targetUserId}>{saving ? 'Saving...' : 'Save attendance'}</Button></div></Card>}

          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Selected date</p><h2 className="mt-2 text-lg font-semibold text-[var(--os-text)]">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>{selectedRecord ? <div className="mt-4 space-y-3"><div className="flex items-center justify-between"><span className="text-xs text-[var(--os-text-muted)]">Status</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[selectedRecord.status]}`}>{statuses.find((item) => item.value === selectedRecord.status)?.label}</span></div><SummaryRow label="Check-in" value={timeLabel(selectedRecord.checkIn)} /><SummaryRow label="Check-out" value={timeLabel(selectedRecord.checkOut)} /><SummaryRow label="Duration" value={hoursBetween(selectedRecord.checkIn, selectedRecord.checkOut)} />{selectedRecord.note && <div className="rounded-xl bg-[var(--os-surface-hover)] p-3 text-xs leading-5 text-[var(--os-text-secondary)]">{selectedRecord.note}</div>}</div> : <p className="mt-3 text-xs text-[var(--os-text-muted)]">No record for the selected member on this date.</p>}</Card>
        </aside>
      </div>
    </div>
  )
}

function CalendarCell({ day, date, today, selected, record, onClick }: { day: number; date: string; today: string; selected: boolean; record?: AttendanceRecord; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-20 rounded-xl border p-2 text-left transition ${selected ? 'border-[var(--os-accent)] ring-2 ring-[var(--os-accent)]/15' : 'border-[var(--os-border)] hover:border-[var(--os-accent)]/50'} ${date === today ? 'bg-[var(--os-accent-soft)]' : 'bg-[var(--os-surface-raised)]'}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[var(--os-text)]">{day}</span>{record && <span className={`h-2 w-2 rounded-full ${record.status === 'present' ? 'bg-[var(--os-success)]' : record.status === 'late' ? 'bg-[var(--os-warning)]' : record.status === 'absent' ? 'bg-[var(--os-danger)]' : 'bg-[var(--os-accent)]`} />}</div>{record && <><p className={`mt-3 truncate rounded-md px-1.5 py-1 text-[9px] font-semibold ${statusStyles[record.status]}`}>{statuses.find((item) => item.value === record.status)?.label}</p><p className="mt-1 text-[9px] text-[var(--os-text-muted)]">{timeLabel(record.checkIn)}{record.checkOut ? ` · ${timeLabel(record.checkOut)}` : ''}</p></>}</button>
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <Card className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><div className="min-w-0"><p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 truncate text-sm font-bold text-[var(--os-text)]">{value}</p></div></div></Card>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-xs text-[var(--os-text-muted)]">{label}</span><span className="text-xs font-semibold text-[var(--os-text-secondary)]">{value}</span></div>
}

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CalendarCheck2, Clock3, Download, LogIn, LogOut, Search, UserCheck, Users } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
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
const inputClass = 'os-focus-ring mt-1 h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]'

function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function monthBounds(value: string) { const [year, month] = value.split('-').map(Number); const last = new Date(year, month, 0).getDate(); return { start: `${value}-01`, end: `${value}-${String(last).padStart(2, '0')}` } }
function daysInMonth(value: string) { const [year, month] = value.split('-').map(Number); return new Date(year, month, 0).getDate() }
function weekdayOffset(value: string) { const [year, month] = value.split('-').map(Number); return new Date(year, month - 1, 1).getDay() }
function monthLabel(value: string) { const [year, month] = value.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
function timeLabel(value?: Date) { return value ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }
function duration(a?: Date, b?: Date) { if (!a || !b) return '—'; const mins = Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000)); return `${Math.floor(mins / 60)}h ${mins % 60}m` }
function timeValue(value?: Date) { return value ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` : '' }
function combineDateTime(date: string, time: string) { if (!date || !time) return undefined; const value = new Date(`${date}T${time}:00`); return Number.isNaN(value.getTime()) ? undefined : value }

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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all')
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

  const targetUserId = canManage ? selectedUser || members[0]?.userId || '' : userId || ''
  const myToday = records.find((item) => item.userId === userId && item.date === today)
  const selectedRecord = records.find((item) => item.userId === targetUserId && item.date === selectedDate)
  const present = records.filter((item) => item.status === 'present').length
  const late = records.filter((item) => item.status === 'late').length
  const leave = records.filter((item) => item.status === 'leave').length
  const absent = records.filter((item) => item.status === 'absent').length
  const attended = records.filter((item) => item.status === 'present' || item.status === 'late' || item.status === 'half-day').length
  const checkedOut = records.filter((item) => item.checkOut).length
  const workingMinutes = records.reduce((sum, item) => sum + (item.checkIn && item.checkOut ? Math.max(0, Math.round((item.checkOut.getTime() - item.checkIn.getTime()) / 60000)) : 0), 0)
  const attendanceRate = records.length ? Math.round((attended / records.length) * 100) : 0
  const calendarDays = useMemo(() => { const offset = weekdayOffset(month); return Array.from({ length: offset + daysInMonth(month) }, (_, index) => index < offset ? null : index - offset + 1) }, [month])
  const visibleRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((item) => {
      const person = members.find((member) => member.userId === item.userId)
      const text = `${person?.displayName ?? ''} ${person?.email ?? ''} ${item.date} ${item.status}`.toLowerCase()
      return (!q || text.includes(q)) && (statusFilter === 'all' || item.status === statusFilter)
    })
  }, [records, members, search, statusFilter])

  function recordFor(day: number) { return records.find((item) => item.userId === targetUserId && item.date === `${month}-${String(day).padStart(2, '0')}`) }
  function changeMonth(delta: number) { const [y, m] = month.split('-').map(Number); const next = new Date(y, m - 1 + delta, 1); const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`; setMonth(value); setSelectedDate(`${value}-01`) }
  async function save(target: string, date: string, status: AttendanceStatus, checkIn?: Date, checkOut?: Date, note?: string) {
    if (!workspaceId || !userId || !target) return
    setSaving(true); setError('')
    try { await saveAttendance({ workspaceId, userId: target, date, status, markedBy: userId, checkIn, checkOut, note }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save attendance.') }
    finally { setSaving(false) }
  }
  function exportCsv() {
    const rows = [['Date', 'Member', 'Status', 'Check in', 'Check out', 'Duration', 'Note']]
    visibleRecords.forEach((record) => { const person = members.find((member) => member.userId === record.userId); rows.push([record.date, person?.displayName || person?.email || record.userId, record.status, timeLabel(record.checkIn), timeLabel(record.checkOut), duration(record.checkIn, record.checkOut), record.note || '']) })
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `attendance-${month}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }

  if (!canView) return <div className="mx-auto max-w-[1400px] p-6"><Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">You do not have permission to view attendance.</Card></div>
  return <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Operations</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Attendance</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">Realtime attendance, workforce insights, check-in/out and monthly planning.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => changeMonth(-1)} className="h-10 rounded-xl border border-[var(--os-border)] px-3 text-sm">←</button><input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setSelectedDate(`${e.target.value}-01`) }} className={inputClass + ' mt-0 w-auto'} /><button type="button" onClick={() => changeMonth(1)} className="h-10 rounded-xl border border-[var(--os-border)] px-3 text-sm">→</button><button type="button" onClick={() => { setMonth(today.slice(0, 7)); setSelectedDate(today) }} className="h-10 rounded-xl border border-[var(--os-border)] px-3 text-sm">Today</button>{canManage && <Button type="button" variant="secondary" onClick={exportCsv}><Download size={15} /> CSV</Button>}</div></header>
    {error && <div role="alert" className="mt-5 rounded-xl border border-[var(--os-danger)]/20 bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Stat icon={<CalendarCheck2 size={18} />} label="My status" value={myToday?.status ? statuses.find((x) => x.value === myToday.status)?.label ?? myToday.status : 'Not marked'} /><Stat icon={<Clock3 size={18} />} label="My check-in" value={timeLabel(myToday?.checkIn)} /><Stat icon={<UserCheck size={18} />} label="Present / late" value={`${present} / ${late}`} /><Stat icon={<Users size={18} />} label="Leave / absent" value={`${leave} / ${absent}`} /><Stat icon={<Clock3 size={18} />} label="Attendance rate" value={`${attendanceRate}%`} /></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-3"><Insight label="Monthly work time" value={`${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m`} /><Insight label="Checked out" value={`${checkedOut} / ${records.length}`} /><Insight label="Attendance records" value={String(records.length)} /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_390px]"><div className="space-y-6">
      <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--os-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Attendance calendar</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">{monthLabel(month)} · click any date to inspect or mark.</p></div>{canManage && <Select value={targetUserId} onChange={setSelectedUser} options={members.map((member) => ({ value: member.userId, label: member.displayName || member.email || member.userId, description: member.email && member.displayName ? member.email : undefined }))} placeholder="Select member" className="w-full sm:w-64" />}</div><div className="p-4 sm:p-5"><div className="mb-3 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-1.5">{calendarDays.map((day, index) => day === null ? <div key={`empty-${index}`} className="min-h-20" /> : <CalendarCell key={day} day={day} date={`${month}-${String(day).padStart(2, '0')}`} today={today} selected={selectedDate === `${month}-${String(day).padStart(2, '0')}`} record={recordFor(day)} onClick={() => setSelectedDate(`${month}-${String(day).padStart(2, '0')}`)} />)}</div></div></Card>
      <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--os-border)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Monthly attendance log</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">{visibleRecords.length} visible records · live updates</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search member or date" className="h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-9 pr-3 text-xs" /></div><Select value={statusFilter} onChange={(value) => setStatusFilter(value as AttendanceStatus | 'all')} options={[{ value: 'all', label: 'All statuses' }, ...statuses.map((item) => ({ value: item.value, label: item.label }))]} className="sm:w-40" /></div></div>{visibleRecords.length === 0 ? <div className="p-10 text-center text-sm text-[var(--os-text-secondary)]">No attendance records for this month.</div> : <div className="divide-y divide-[var(--os-border)]">{visibleRecords.map((record) => { const person = members.find((member) => member.userId === record.userId); return <button type="button" key={record.id} onClick={() => { setSelectedDate(record.date); if (canManage) setSelectedUser(record.userId) }} className="flex w-full flex-col gap-2 px-5 py-4 text-left transition hover:bg-[var(--os-surface-hover)] sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[var(--os-text)]">{person?.displayName || person?.email || record.userId}</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">{record.date} · {timeLabel(record.checkIn)} → {timeLabel(record.checkOut)} · {duration(record.checkIn, record.checkOut)}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[record.status]}`}>{statuses.find((x) => x.value === record.status)?.label}</span></button> })}</div>}</Card>
    </div><aside className="space-y-6 xl:sticky xl:top-5 xl:self-start">
      {!canManage && <SelfAttendanceCard record={myToday} saving={saving} onSave={save} userId={userId || ''} today={today} />}
      {canManage && <ManagerAttendanceCard key={`${targetUserId}-${selectedDate}-${selectedRecord?.id || 'new'}`} record={selectedRecord} members={members} targetUserId={targetUserId} selectedDate={selectedDate} saving={saving} onSave={save} onMemberChange={setSelectedUser} onDateChange={setSelectedDate} />}
      <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Selected date</p><h2 className="mt-2 text-lg font-semibold text-[var(--os-text)]">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>{selectedRecord ? <div className="mt-4 space-y-3"><div className="flex items-center justify-between"><span className="text-xs text-[var(--os-text-muted)]">Status</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[selectedRecord.status]}`}>{statuses.find((x) => x.value === selectedRecord.status)?.label}</span></div><SummaryRow label="Check-in" value={timeLabel(selectedRecord.checkIn)} /><SummaryRow label="Check-out" value={timeLabel(selectedRecord.checkOut)} /><SummaryRow label="Duration" value={duration(selectedRecord.checkIn, selectedRecord.checkOut)} />{selectedRecord.note && <div className="rounded-xl bg-[var(--os-surface-hover)] p-3 text-xs leading-5 text-[var(--os-text-secondary)]">{selectedRecord.note}</div>}</div> : <p className="mt-3 text-xs text-[var(--os-text-muted)]">No record for the selected member on this date.</p>}</Card>
    </aside></div>
  </div>
}

function SelfAttendanceCard({ record, saving, onSave, userId, today }: { record?: AttendanceRecord; saving: boolean; onSave: (target: string, date: string, status: AttendanceStatus, checkIn?: Date, checkOut?: Date, note?: string) => Promise<void>; userId: string; today: string }) {
  const [checkInTime, setCheckInTime] = useState(timeValue(record?.checkIn) || timeValue(new Date()))
  const [checkOutTime, setCheckOutTime] = useState(timeValue(record?.checkOut) || timeValue(new Date()))
  const checkIn = combineDateTime(today, checkInTime)
  const checkOut = combineDateTime(today, checkOutTime)
  return <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Today</p><h2 className="mt-2 text-lg font-semibold text-[var(--os-text)]">Your attendance</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">Choose the exact time or use the current time shown in the field.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Field label="Check-in time"><input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputClass} /></Field><Field label="Check-out time"><input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className={inputClass} /></Field></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><Button type="button" onClick={() => void onSave(userId, today, 'present', checkIn, record?.checkOut)} disabled={saving || Boolean(record?.checkIn)}><LogIn size={15} />{record?.checkIn ? `Checked in ${timeLabel(record.checkIn)}` : 'Check in'}</Button><Button type="button" variant="secondary" onClick={() => void onSave(userId, today, record?.status ?? 'present', record?.checkIn, checkOut)} disabled={saving || !record?.checkIn || Boolean(record?.checkOut)}><LogOut size={15} />{record?.checkOut ? `Checked out ${timeLabel(record.checkOut)}` : 'Check out'}</Button></div>{record?.checkIn && record?.checkOut && <div className="mt-4 rounded-xl bg-[var(--os-surface-hover)] p-3 text-xs text-[var(--os-text-secondary)]">Worked today: <strong className="text-[var(--os-text)]">{duration(record.checkIn, record.checkOut)}</strong></div>}</Card>
}

function ManagerAttendanceCard({ record, members, targetUserId, selectedDate, saving, onSave, onMemberChange, onDateChange }: { record?: AttendanceRecord; members: WorkspaceMember[]; targetUserId: string; selectedDate: string; saving: boolean; onSave: (target: string, date: string, status: AttendanceStatus, checkIn?: Date, checkOut?: Date, note?: string) => Promise<void>; onMemberChange: (value: string) => void; onDateChange: (value: string) => void }) {
  const [status, setStatus] = useState<AttendanceStatus>(record?.status ?? 'present')
  const [checkInTime, setCheckInTime] = useState(timeValue(record?.checkIn))
  const [checkOutTime, setCheckOutTime] = useState(timeValue(record?.checkOut))
  const [note, setNote] = useState(record?.note ?? '')
  const checkIn = combineDateTime(selectedDate, checkInTime)
  const checkOut = combineDateTime(selectedDate, checkOutTime)
  return <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Manager controls</p><h2 className="mt-2 text-lg font-semibold text-[var(--os-text)]">Mark attendance</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">Manage status, exact times and notes for the selected member.</p><div className="mt-4 space-y-4"><Field label="Member"><Select value={targetUserId} onChange={onMemberChange} options={members.map((member) => ({ value: member.userId, label: member.displayName || member.email || member.userId, description: member.email && member.displayName ? member.email : undefined }))} placeholder="Select member" /></Field><Field label="Date"><input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} className={inputClass} /></Field><Field label="Status"><Select value={status} onChange={(value) => setStatus(value as AttendanceStatus)} options={statuses.map((item) => ({ value: item.value, label: item.label }))} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Check-in time"><input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputClass} /></Field><Field label="Check-out time"><input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className={inputClass} /></Field></div><Field label="Note"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional attendance note..." className="os-focus-ring mt-1 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2 text-sm text-[var(--os-text)]" /></Field><Button type="button" onClick={() => void onSave(targetUserId, selectedDate, status, checkIn, checkOut, note)} disabled={saving || !targetUserId}>{saving ? 'Saving...' : record ? 'Update attendance' : 'Save attendance'}</Button></div></Card>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">{label}</span>{children}</label> }
function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <Card className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><div className="min-w-0"><p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 truncate text-sm font-bold text-[var(--os-text)]">{value}</p></div></div></Card> }
function Insight({ label, value }: { label: string; value: string }) { return <Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-2 text-lg font-bold text-[var(--os-text)]">{value}</p></Card> }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-xs text-[var(--os-text-muted)]">{label}</span><span className="text-xs font-semibold text-[var(--os-text-secondary)]">{value}</span></div> }
function CalendarCell({ day, date, today, selected, record, onClick }: { day: number; date: string; today: string; selected: boolean; record?: AttendanceRecord; onClick: () => void }) { return <button type="button" onClick={onClick} className={`min-h-20 rounded-xl border p-2 text-left transition ${selected ? 'border-[var(--os-accent)] ring-2 ring-[var(--os-accent)]/15' : 'border-[var(--os-border)] hover:border-[var(--os-accent)]/50'} ${date === today ? 'bg-[var(--os-accent-soft)]' : 'bg-[var(--os-surface-raised)]'}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[var(--os-text)]">{day}</span>{record && <span className={`h-2 w-2 rounded-full ${record.status === 'present' ? 'bg-[var(--os-success)]' : record.status === 'late' ? 'bg-[var(--os-warning)]' : record.status === 'absent' ? 'bg-[var(--os-danger)]' : 'bg-[var(--os-accent)]`} />}</div>{record && <><p className={`mt-3 truncate rounded-md px-1.5 py-1 text-[9px] font-semibold ${statusStyles[record.status]}`}>{statuses.find((item) => item.value === record.status)?.label}</p><p className="mt-1 text-[9px] text-[var(--os-text-muted)]">{timeLabel(record.checkIn)}{record.checkOut ? ` · ${timeLabel(record.checkOut)}` : ''}</p></>}</button> }

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionHeader from '../components/ui/SectionHeader'
import ThemeSelect from '../components/ui/ThemeSelect'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type CalendarEvent = { id: string; title: string; date: string; time: string; type: string; notes: string; createdBy?: string }
type Option = { value: string; label: string }
type ViewFilter = 'all' | 'meeting' | 'deadline' | 'renewal' | 'reminder' | 'other'

const eventTypeOptions: Option[] = [
  { value: 'meeting', label: 'Meeting' }, { value: 'deadline', label: 'Deadline' }, { value: 'renewal', label: 'Renewal' }, { value: 'reminder', label: 'Reminder' }, { value: 'other', label: 'Other' },
]
const typeBadge: Record<string, string> = { meeting: 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]', deadline: 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]', renewal: 'bg-[var(--os-warning-soft)] text-[var(--os-warning)]', reminder: 'bg-[var(--os-info-soft)] text-[var(--os-info)]', other: 'bg-[var(--os-surface-hover)] text-[var(--os-text-secondary)]' }
const today = () => new Date().toISOString().slice(0, 10)
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const dateLabel = (value: string) => { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }

export default function Calendar() {
  const { user } = useAuth()
  const { workspace, loading, hasPermission } = useWorkspace()
  const canManage = hasPermission('calendar.manage')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ViewFilter>('all')
  const [month, setMonth] = useState(() => new Date())
  const [form, setForm] = useState({ title: '', date: today(), time: '10:00', type: 'meeting', notes: '' })

  useEffect(() => {
    if (loading || !workspace?.id) return undefined
    setError('')
    return onSnapshot(
      query(collection(db, 'calendarEvents'), where('workspaceId', '==', workspace.id)),
      snapshot => setEvents(snapshot.docs.map(item => {
        const d = item.data()
        return { id: item.id, title: String(d.title ?? ''), date: String(d.date ?? ''), time: String(d.time ?? ''), type: String(d.type ?? 'other'), notes: String(d.notes ?? ''), createdBy: String(d.createdBy ?? '') }
      }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))),
      e => { console.error(e); setError('Calendar data could not be loaded.') },
    )
  }, [workspace?.id, loading])

  const visibleEvents = useMemo(() => { const q = search.trim().toLowerCase(); return events.filter(e => (!q || `${e.title} ${e.notes} ${e.type}`.toLowerCase().includes(q)) && (filter === 'all' || e.type === filter)) }, [events, search, filter])
  const upcoming = useMemo(() => visibleEvents.filter(e => `${e.date}T${e.time}` >= new Date().toISOString().slice(0, 16)).slice(0, 12), [visibleEvents])
  const overdue = events.filter(e => `${e.date}T${e.time}` < new Date().toISOString().slice(0, 16)).length
  const monthEvents = visibleEvents.filter(e => e.date.startsWith(monthKey(month)))

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first); start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date })
  }, [month])

  function resetForm() { setEditing(null); setForm({ title: '', date: today(), time: '10:00', type: 'meeting', notes: '' }) }
  function openEdit(item: CalendarEvent) { setEditing(item); setForm({ title: item.title, date: item.date, time: item.time, type: item.type, notes: item.notes }); setError('') }
  function openCreate(date = today()) { setEditing(null); setForm({ title: '', date, time: '10:00', type: 'meeting', notes: '' }); setError('') }

  async function saveEvent(event: FormEvent) {
    event.preventDefault()
    if (!workspace?.id || !user?.uid || !canManage || !form.title.trim()) return
    setSaving(true); setError('')
    try {
      const payload = { title: form.title.trim(), date: form.date, time: form.time, type: form.type, notes: form.notes.trim(), updatedAt: serverTimestamp() }
      if (editing) await updateDoc(doc(db, 'calendarEvents', editing.id), payload)
      else await addDoc(collection(db, 'calendarEvents'), { ...payload, workspaceId: workspace.id, createdBy: user.uid, createdAt: serverTimestamp() })
      resetForm()
    } catch (e) { console.error(e); setError(editing ? 'Could not update the event.' : 'Could not create the event.') } finally { setSaving(false) }
  }

  async function removeEvent() {
    if (!canManage || !deleteTarget) return
    setDeleting(true); setError('')
    try { await deleteDoc(doc(db, 'calendarEvents', deleteTarget.id)); setDeleteTarget(null) } catch (e) { console.error(e); setError('Could not delete the event.') } finally { setDeleting(false) }
  }

  return <>
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Operations</p><h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Calendar</h1><p className="mt-2 max-w-2xl text-sm text-[var(--os-text-secondary)]">One command center for meetings, deadlines, renewals and business reminders.</p></div>{canManage && <Button type="button" onClick={() => openCreate()}><Plus size={16}/> New event</Button>}</div>
      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
      <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Total events</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{events.length}</p></Card><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">This month</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{monthEvents.length}</p></Card><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Past events</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{overdue}</p></Card></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-[var(--os-border)] pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><button type="button" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><ChevronLeft size={17}/></button><h2 className="min-w-[150px] text-center text-base font-semibold text-[var(--os-text)]">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2><button type="button" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><ChevronRight size={17}/></button></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-9 pr-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)] sm:w-56"/></label><ThemeSelect value={filter} onChange={value => setFilter(value as ViewFilter)} options={[{ value: 'all', label: 'All types' }, ...eventTypeOptions]}/></div></div>
          <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-border)]"><div className="col-span-7 grid grid-cols-7 bg-[var(--os-surface-raised)]">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <div key={day} className="p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">{day}</div>)}</div>{calendarDays.map(day => { const key = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`; const dayEvents = monthEvents.filter(e => e.date === key); const inMonth = day.getMonth() === month.getMonth(); const isToday = key === today(); return <button key={key} type="button" onClick={() => canManage && openCreate(key)} className={`min-h-[92px] bg-[var(--os-surface)] p-2 text-left align-top transition hover:bg-[var(--os-surface-hover)] ${!inMonth ? 'opacity-40' : ''}`}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? 'bg-[var(--os-accent)] text-white' : 'text-[var(--os-text-secondary)]'}`}>{day.getDate()}</span><div className="mt-1 space-y-1">{dayEvents.slice(0, 2).map(e => <span key={e.id} title={e.title} onClick={event => { event.stopPropagation(); openEdit(e) }} className={`block truncate rounded-md px-1.5 py-1 text-[9px] font-semibold ${typeBadge[e.type] || typeBadge.other}`}>{e.time} · {e.title}</span>)}{dayEvents.length > 2 && <span className="block px-1 text-[9px] text-[var(--os-text-muted)]">+{dayEvents.length - 2} more</span>}</div></button> })}</div>
          <p className="mt-3 text-[10px] text-[var(--os-text-muted)]">Click a day to create an event. Click an event to edit it.</p>
        </Card>
        <div className="space-y-6">
          {canManage && <Card className="p-5"><div className="flex items-center justify-between"><SectionHeader title={editing ? 'Edit event' : 'Add event'} description={editing ? 'Update the selected calendar item.' : 'Create a meeting, deadline or reminder.'}/>{editing && <button type="button" onClick={resetForm} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]" aria-label="Cancel editing"><X size={16}/></button>}</div><form onSubmit={saveEvent} className="mt-5 space-y-3"><input required placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]"/><div className="grid grid-cols-2 gap-3"><input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none"/><input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none"/></div><ThemeSelect value={form.type} onChange={value => setForm(f => ({ ...f, type: value }))} options={eventTypeOptions}/><textarea rows={4} placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]"/><div className="flex gap-2"><Button type="submit" disabled={saving} className="flex-1"><Plus size={16}/>{saving ? 'Saving…' : editing ? 'Update event' : 'Add event'}</Button>{editing && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}</div></form></Card>}
          <Card className="p-5"><SectionHeader title="Upcoming" description={`${upcoming.length} matching events`}/>{upcoming.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-[var(--os-border)] p-8 text-center"><CalendarDays className="mx-auto text-[var(--os-text-muted)]" size={28}/><p className="mt-3 text-sm font-medium text-[var(--os-text)]">Nothing upcoming</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">Your next meetings and deadlines will appear here.</p></div> : <div className="mt-4 space-y-2">{upcoming.map(item => <div key={item.id} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><CalendarDays size={15}/></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--os-text)]">{item.title}</p><p className="mt-1 text-[11px] text-[var(--os-text-muted)]">{dateLabel(item.date)} · {item.time}</p></div></div><span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${typeBadge[item.type] || typeBadge.other}`}>{item.type}</span></div>{item.notes && <p className="mt-2 line-clamp-2 text-xs text-[var(--os-text-secondary)]">{item.notes}</p>}<div className="mt-3 flex justify-end gap-1">{canManage && <><button type="button" onClick={() => openEdit(item)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]" aria-label={`Edit ${item.title}`}><Pencil size={14}/></button><button type="button" onClick={() => setDeleteTarget(item)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)]" aria-label={`Delete ${item.title}`}><Trash2 size={14}/></button></>}</div></div>)}</div>}</Card>
          <Card className="p-5"><div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[var(--os-success)]"/><div><p className="text-sm font-semibold text-[var(--os-text)]">Execution signal</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">{monthEvents.length} events scheduled this month. Keep deadlines visible and renewals ahead of time.</p></div></div><div className="mt-4 flex items-center gap-2 text-xs text-[var(--os-text-muted)]"><Clock3 size={14}/> Past events: {overdue}</div></Card>
        </div>
      </div>
    </div>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete calendar event?" description={deleteTarget ? `“${deleteTarget.title}” will be permanently removed from this workspace calendar.` : ''} confirmLabel="Delete event" loading={deleting} onCancel={() => !deleting && setDeleteTarget(null)} onConfirm={() => void removeEvent()} />
  </>
}

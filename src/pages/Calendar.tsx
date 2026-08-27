import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ListTodo, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionHeader from '../components/ui/SectionHeader'
import ThemeSelect from '../components/ui/ThemeSelect'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type CalendarEvent = { id: string; title: string; date: string; time: string; type: string; notes: string; createdBy?: string }
type CalendarTask = { id: string; title: string; date: string; status: string; priority: string }
type Option = { value: string; label: string }
type ViewFilter = 'all' | 'meeting' | 'deadline' | 'renewal' | 'reminder' | 'other'
type CalendarView = 'month' | 'agenda'

const eventTypeOptions: Option[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'other', label: 'Other' },
]
const typeBadge: Record<string, string> = {
  meeting: 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]',
  deadline: 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]',
  renewal: 'bg-[var(--os-warning-soft)] text-[var(--os-warning)]',
  reminder: 'bg-[var(--os-info-soft)] text-[var(--os-info)]',
  other: 'bg-[var(--os-surface-hover)] text-[var(--os-text-secondary)]',
}
const taskBadge = 'bg-[var(--os-info-soft)] text-[var(--os-info)]'

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` }
function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function timeLabel(value: string) {
  if (!value) return 'All day'
  const [hour, minute] = value.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  const date = new Date(); date.setHours(hour, minute, 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}
function taskDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return localDateKey((value as { toDate: () => Date }).toDate())
  if (value instanceof Date) return localDateKey(value)
  if (typeof value === 'string' && value) return value.slice(0, 10)
  return ''
}

export default function Calendar() {
  const { user } = useAuth()
  const { workspace, loading, hasPermission } = useWorkspace()
  const canManage = hasPermission('calendar.manage')
  const canViewTasks = hasPermission('tasks.view')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ViewFilter>('all')
  const [view, setView] = useState<CalendarView>('month')
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const [form, setForm] = useState({ title: '', date: localDateKey(), time: '10:00', type: 'meeting', notes: '' })

  useEffect(() => {
    if (loading || !workspace?.id) return undefined
    const workspaceId = workspace.id
    setError('')
    const unsubscribe = onSnapshot(
      query(collection(db, 'calendarEvents'), where('workspaceId', '==', workspaceId)),
      snapshot => {
        setEvents(snapshot.docs.map(item => {
          const data = item.data()
          return {
            id: item.id,
            title: String(data.title ?? ''),
            date: String(data.date ?? ''),
            time: String(data.time ?? ''),
            type: String(data.type ?? 'other'),
            notes: String(data.notes ?? ''),
            createdBy: String(data.createdBy ?? ''),
          }
        }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)))
      },
      listenerError => {
        console.error('Calendar listener error:', listenerError)
        setError(`Calendar could not be loaded: ${listenerError.message || 'permission or connection error.'}`)
      },
    )
    return unsubscribe
  }, [workspace?.id, loading])

  useEffect(() => {
    if (loading || !workspace?.id || !canViewTasks) { setTasks([]); return undefined }
    const workspaceId = workspace.id
    return onSnapshot(
      query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId)),
      snapshot => setTasks(snapshot.docs.map(item => {
        const data = item.data()
        return { id: item.id, title: String(data.title ?? 'Untitled task'), date: taskDate(data.dueDate), status: String(data.status ?? 'todo'), priority: String(data.priority ?? 'medium') }
      }).filter(item => item.date)),
      listenerError => { console.error('Task calendar listener error:', listenerError) },
    )
  }, [workspace?.id, loading, canViewTasks])

  const visibleEvents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter(item => (!q || `${item.title} ${item.notes} ${item.type}`.toLowerCase().includes(q)) && (filter === 'all' || item.type === filter))
  }, [events, search, filter])
  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter(item => !q || `${item.title} ${item.status} ${item.priority} task`.toLowerCase().includes(q))
  }, [tasks, search])
  const monthEvents = visibleEvents.filter(item => item.date.startsWith(monthKey(month)))
  const monthTasks = visibleTasks.filter(item => item.date.startsWith(monthKey(month)))
  const upcoming = useMemo(() => [...visibleEvents.map(item => ({ kind: 'event' as const, date: item.date, time: item.time, title: item.title, item })), ...visibleTasks.map(item => ({ kind: 'task' as const, date: item.date, time: '', title: item.title, item }))].filter(item => `${item.date}T${item.time || '23:59'}` >= `${localDateKey()}T00:00`).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).slice(0, 12), [visibleEvents, visibleTasks])
  const overdue = events.filter(item => `${item.date}T${item.time || '23:59'}` < `${localDateKey()}T00:00`).length

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first); start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date })
  }, [month])

  const selectedEvents = visibleEvents.filter(item => item.date === selectedDate)
  const selectedTasks = visibleTasks.filter(item => item.date === selectedDate)

  function resetForm() { setEditing(null); setForm({ title: '', date: selectedDate || localDateKey(), time: '10:00', type: 'meeting', notes: '' }) }
  function openEdit(item: CalendarEvent) { setEditing(item); setSelectedDate(item.date); setForm({ title: item.title, date: item.date, time: item.time || '10:00', type: item.type, notes: item.notes }); setError('') }
  function openCreate(date = selectedDate || localDateKey()) { setEditing(null); setSelectedDate(date); setForm({ title: '', date, time: '10:00', type: 'meeting', notes: '' }); setError('') }

  async function saveEvent(event: FormEvent) {
    event.preventDefault()
    const workspaceId = workspace?.id
    if (!workspaceId || !user?.uid || !canManage) { setError('You do not have permission to manage calendar events.'); return }
    const title = form.title.trim()
    if (!title) { setError('Please enter an event title.'); return }
    if (!form.date || !form.time) { setError('Please select a date and time.'); return }
    setSaving(true); setError('')
    try {
      const payload = { title, date: form.date, time: form.time, type: form.type, notes: form.notes.trim(), workspaceId, updatedAt: serverTimestamp() }
      if (editing) {
        await updateDoc(doc(db, 'calendarEvents', editing.id), payload)
        setEvents(current => current.map(item => item.id === editing.id ? { ...item, title, date: form.date, time: form.time, type: form.type, notes: form.notes.trim() } : item).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)))
      } else {
        const reference = await addDoc(collection(db, 'calendarEvents'), { ...payload, createdBy: user.uid, createdAt: serverTimestamp() })
        setEvents(current => [...current, { id: reference.id, title, date: form.date, time: form.time, type: form.type, notes: form.notes.trim(), createdBy: user.uid }].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)))
      }
      setSelectedDate(form.date)
      setMonth(new Date(`${form.date}T12:00:00`))
      resetForm()
    } catch (e) {
      console.error('Calendar save error:', e)
      setError(e instanceof Error ? `Could not save event: ${e.message}` : 'Could not save the event. Check Firebase permissions and connection.')
    } finally { setSaving(false) }
  }

  async function removeEvent() {
    if (!canManage || !deleteTarget) return
    setDeleting(true); setError('')
    try { await deleteDoc(doc(db, 'calendarEvents', deleteTarget.id)); setEvents(current => current.filter(item => item.id !== deleteTarget.id)); setDeleteTarget(null) }
    catch (e) { console.error(e); setError(e instanceof Error ? `Could not delete event: ${e.message}` : 'Could not delete the event.') }
    finally { setDeleting(false) }
  }

  return <>
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Operations</p><h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Calendar</h1><p className="mt-2 max-w-2xl text-sm text-[var(--os-text-secondary)]">Meetings, deadlines, renewals, reminders and task due dates in one command center.</p></div>
        {canManage && <Button type="button" onClick={() => openCreate()}><Plus size={16}/> New event</Button>}
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
      <div className="mb-5 grid gap-4 sm:grid-cols-4"><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Calendar events</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{events.length}</p></Card><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">This month</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{monthEvents.length + monthTasks.length}</p></Card><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Tasks scheduled</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{tasks.length}</p></Card><Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Past events</p><p className="mt-2 text-2xl font-semibold text-[var(--os-text)]">{overdue}</p></Card></div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl bg-[var(--os-surface-hover)] p-1"><button type="button" onClick={() => setView('month')} className={`rounded-lg px-4 py-2 text-xs font-semibold ${view === 'month' ? 'bg-[var(--os-surface)] text-[var(--os-text)] shadow-sm' : 'text-[var(--os-text-muted)]'}`}><CalendarDays size={14} className="mr-2 inline"/>Month</button><button type="button" onClick={() => setView('agenda')} className={`rounded-lg px-4 py-2 text-xs font-semibold ${view === 'agenda' ? 'bg-[var(--os-surface)] text-[var(--os-text)] shadow-sm' : 'text-[var(--os-text-muted)]'}`}><ListTodo size={14} className="mr-2 inline"/>Agenda</button></div>
        <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events & tasks..." className="h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-9 pr-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)] sm:w-64"/></label><ThemeSelect value={filter} onChange={value => setFilter(value as ViewFilter)} options={[{ value: 'all', label: 'All event types' }, ...eventTypeOptions]}/></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
          {view === 'month' ? <>
            <div className="flex flex-col gap-3 border-b border-[var(--os-border)] pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><button type="button" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><ChevronLeft size={17}/></button><h2 className="min-w-[170px] text-center text-base font-semibold text-[var(--os-text)]">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2><button type="button" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><ChevronRight size={17}/></button></div><button type="button" onClick={() => { const now = new Date(); setMonth(now); setSelectedDate(localDateKey(now)) }} className="rounded-xl border border-[var(--os-border)] px-3 py-2 text-xs font-semibold text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]">Today</button></div>
            <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-border)]"><div className="col-span-7 grid grid-cols-7 bg-[var(--os-surface-raised)]">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <div key={day} className="p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">{day}</div>)}</div>{calendarDays.map(day => { const key = localDateKey(day); const dayEvents = monthEvents.filter(item => item.date === key); const dayTasks = monthTasks.filter(item => item.date === key); const inMonth = day.getMonth() === month.getMonth(); const isToday = key === localDateKey(); const isSelected = key === selectedDate; return <button key={key} type="button" onClick={() => setSelectedDate(key)} className={`min-h-[105px] bg-[var(--os-surface)] p-2 text-left align-top transition hover:bg-[var(--os-surface-hover)] ${!inMonth ? 'opacity-40' : ''} ${isSelected ? 'ring-2 ring-inset ring-[var(--os-accent)]' : ''}`}><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? 'bg-[var(--os-accent)] text-white' : 'text-[var(--os-text-secondary)]'}`}>{day.getDate()}</span><div className="mt-1 space-y-1">{dayEvents.slice(0, 2).map(item => <span key={item.id} title={item.title} onClick={event => { event.stopPropagation(); openEdit(item) }} className={`block truncate rounded-md px-1.5 py-1 text-[9px] font-semibold ${typeBadge[item.type] || typeBadge.other}`}>{item.time} · {item.title}</span>)}{dayTasks.slice(0, Math.max(0, 2 - dayEvents.length)).map(item => <span key={`task-${item.id}`} title={`Task: ${item.title}`} className={`block truncate rounded-md px-1.5 py-1 text-[9px] font-semibold ${taskBadge}`}>Task · {item.title}</span>)}{dayEvents.length + dayTasks.length > 2 && <span className="block px-1 text-[9px] text-[var(--os-text-muted)]">+{dayEvents.length + dayTasks.length - 2} more</span>}</div></button> })}</div>
            <p className="mt-3 text-[10px] text-[var(--os-text-muted)]">Select any date to see everything planned for it below. Click a calendar event to edit it.</p>
          </> : <>
            <div className="border-b border-[var(--os-border)] pb-5"><h2 className="text-lg font-semibold text-[var(--os-text)]">Agenda</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">All scheduled events and task due dates, grouped chronologically.</p></div>
            <div className="mt-5 space-y-3">{upcoming.length === 0 ? <Empty text="Nothing scheduled yet."/> : upcoming.map(item => <div key={`${item.kind}-${item.item.id}`} className="flex items-start gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.kind === 'task' ? taskBadge : typeBadge[item.item.type] || typeBadge.other}`}>{item.kind === 'task' ? <ListTodo size={16}/> : <CalendarDays size={16}/>}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--os-text)]">{item.title}</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">{dateLabel(item.date)}{item.time ? ` · ${timeLabel(item.time)}` : ' · Task due date'}</p></div>{item.kind === 'event' && canManage && <button type="button" onClick={() => openEdit(item.item)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><Pencil size={14}/></button>}</div>)}</div>
          </>}

          <div className="mt-6 border-t border-[var(--os-border)] pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">Selected date</p><h3 className="mt-1 text-lg font-semibold text-[var(--os-text)]">{dateLabel(selectedDate)}</h3></div>{canManage && <Button type="button" variant="secondary" onClick={() => openCreate(selectedDate)}><Plus size={14}/> Add to this date</Button>}</div>
            {selectedEvents.length + selectedTasks.length === 0 ? <Empty text="Nothing planned for this date." /> : <div className="mt-4 space-y-2">{selectedEvents.map(item => <div key={item.id} className="flex items-start gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeBadge[item.type] || typeBadge.other}`}><CalendarDays size={15}/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--os-text)]">{item.title}</p><p className="mt-1 text-[11px] text-[var(--os-text-muted)]">{timeLabel(item.time)} · {eventTypeOptions.find(option => option.value === item.type)?.label ?? 'Event'}</p>{item.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-[var(--os-text-secondary)]">{item.notes}</p>}</div>{canManage && <div className="flex gap-1"><button type="button" onClick={() => openEdit(item)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]" aria-label="Edit event"><Pencil size={14}/></button><button type="button" onClick={() => setDeleteTarget(item)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)]" aria-label="Delete event"><Trash2 size={14}/></button></div>}</div>)}{selectedTasks.map(item => <div key={`selected-task-${item.id}`} className="flex items-start gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${taskBadge}`}><ListTodo size={15}/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--os-text)]">{item.title}</p><p className="mt-1 text-[11px] text-[var(--os-text-muted)]">Task · {item.status.replaceAll('_', ' ')} · {item.priority} priority</p></div></div>)}</div>}
          </div>
        </Card>

        <div className="space-y-6">
          {canManage && <Card className="p-5"><div className="flex items-center justify-between"><SectionHeader title={editing ? 'Edit event' : 'Add event'} description={editing ? 'Update the selected calendar item.' : 'Create a meeting, deadline or reminder.'}/>{editing && <button type="button" onClick={resetForm} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]" aria-label="Cancel editing"><X size={16}/></button>}</div><form onSubmit={saveEvent} className="mt-5 space-y-3"><input required placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]"/><div className="grid grid-cols-2 gap-3"><input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none"/><input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none"/></div><ThemeSelect value={form.type} onChange={value => setForm(f => ({ ...f, type: value }))} options={eventTypeOptions}/><textarea rows={4} placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]"/><div className="flex gap-2"><Button type="submit" disabled={saving} className="flex-1"><Plus size={16}/>{saving ? 'Saving…' : editing ? 'Update event' : 'Add event'}</Button>{editing && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}</div></form></Card>}
          <Card className="p-5"><SectionHeader title="Upcoming" description={`${upcoming.length} scheduled items`}/>{upcoming.length === 0 ? <div className="mt-5"><Empty text="Nothing upcoming. Your next meetings, deadlines and tasks will appear here."/></div> : <div className="mt-4 space-y-2">{upcoming.slice(0, 8).map(item => <div key={`side-${item.kind}-${item.item.id}`} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3"><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.kind === 'task' ? taskBadge : typeBadge[item.item.type] || typeBadge.other}`}>{item.kind === 'task' ? <ListTodo size={15}/> : <Clock3 size={15}/>}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--os-text)]">{item.title}</p><p className="mt-1 text-[11px] text-[var(--os-text-muted)]">{dateLabel(item.date)}{item.time ? ` · ${timeLabel(item.time)}` : ' · Task'}</p></div></div></div>)}</div>}</Card>
        </div>
      </div>
    </div>
    <ConfirmDialog open={deleteTarget !== null} title="Delete event?" description={<>Delete <strong className="text-[var(--os-text)]">{deleteTarget?.title}</strong> from {deleteTarget ? dateLabel(deleteTarget.date) : 'the calendar'}? This action cannot be undone.</>} confirmLabel="Delete event" loading={deleting} onCancel={() => !deleting && setDeleteTarget(null)} onConfirm={() => void removeEvent()} />
  </>
}

function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[var(--os-border)] p-7 text-center"><CheckCircle2 className="mx-auto text-[var(--os-text-muted)]" size={25}/><p className="mt-3 text-sm font-medium text-[var(--os-text)]">{text}</p></div> }

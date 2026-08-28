import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot, query, where, type DocumentData } from 'firebase/firestore'
import { Activity, AlertTriangle, BarChart3, CheckCircle2, CircleDollarSign, Clock3, FileText, FolderKanban, ListTodo, RefreshCw, Target, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type Row = DocumentData & { id: string }
type Snapshot = { projects: Row[]; tasks: Row[]; finance: Row[]; goals: Row[]; quotations: Row[]; clients: Row[]; attendance: Row[]; leaves: Row[] }

const empty: Snapshot = { projects: [], tasks: [], finance: [], goals: [], quotations: [], clients: [], attendance: [], leaves: [] }
const money = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`
const dateOf = (value: unknown) => { if (!value) return null; if (value instanceof Date) return value; if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate(); const d = new Date(String(value)); return Number.isNaN(d.getTime()) ? null : d }
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0
const number = (v: unknown) => Number(v ?? 0) || 0
const text = (v: unknown) => String(v ?? '')

function useWorkspaceCollection(workspaceId: string | undefined, name: string, setError: (value: string) => void) {
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => {
    if (!workspaceId) { setRows([]); return undefined }
    let active = true
    const unsubscribe = onSnapshot(query(collection(db, name), where('workspaceId', '==', workspaceId)), snap => {
      if (active) setRows(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }, error => { console.error(`${name} analytics`, error); if (active) setError(`Some ${name} analytics could not be loaded.`) })
    return () => { active = false; unsubscribe() }
  }, [workspaceId, name, setError])
  return rows
}

export default function Analytics() {
  const { workspace, loading } = useWorkspace()
  const [error, setError] = useState('')
  const id = workspace?.id
  const projects = useWorkspaceCollection(id, 'projects', setError)
  const tasks = useWorkspaceCollection(id, 'tasks', setError)
  const finance = useWorkspaceCollection(id, 'financeEntries', setError)
  const goals = useWorkspaceCollection(id, 'goals', setError)
  const quotations = useWorkspaceCollection(id, 'quotations', setError)
  const clients = useWorkspaceCollection(id, 'clients', setError)
  const attendance = useWorkspaceCollection(id, 'attendance', setError)
  const leaves = useWorkspaceCollection(id, 'leaves', setError)
  const [members, setMembers] = useState<Row[]>([])

  useEffect(() => {
    if (loading || !id) { setMembers([]); return undefined }
    let active = true
    const unsubscribe = onSnapshot(collection(db, 'workspaces', id, 'members'), snap => { if (active) setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))) }, e => { console.error('members analytics', e); if (active) setError('Member analytics could not be loaded.') })
    return () => { active = false; unsubscribe() }
  }, [id, loading, setError])

  const metrics = useMemo(() => {
    const today = startOfDay(new Date())
    const completed = tasks.filter(t => ['completed', 'done'].includes(text(t.status).toLowerCase())).length
    const overdue = tasks.filter(t => !['completed', 'done'].includes(text(t.status).toLowerCase()) && (dateOf(t.dueDate) ?? dateOf(t.deadline)) && (dateOf(t.dueDate) ?? dateOf(t.deadline))! < today).length
    const activeProjects = projects.filter(p => !['completed', 'closed', 'cancelled'].includes(text(p.status).toLowerCase())).length
    const income = finance.filter(f => ['income', 'revenue', 'credit'].includes(text(f.type).toLowerCase())).reduce((s, f) => s + number(f.amount), 0)
    const expense = finance.filter(f => ['expense', 'debit', 'cost'].includes(text(f.type).toLowerCase())).reduce((s, f) => s + number(f.amount), 0)
    const acceptedQuotes = quotations.filter(q => text(q.status).toLowerCase() === 'accepted')
    const pipeline = quotations.filter(q => !['rejected', 'expired'].includes(text(q.status).toLowerCase())).reduce((s, q) => s + number(q.totalAmount ?? q.total ?? q.amount), 0)
    const acceptedValue = acceptedQuotes.reduce((s, q) => s + number(q.totalAmount ?? q.total ?? q.amount), 0)
    const goalItems = goals.length
    const goalDone = goals.filter(g => ['completed', 'done'].includes(text(g.status).toLowerCase()) || number(g.progress) >= 100).length
    const clientActive = clients.filter(c => !['inactive', 'archived'].includes(text(c.status).toLowerCase())).length
    const present = attendance.filter(a => ['present', 'late', 'half-day', 'halfday'].includes(text(a.status).toLowerCase())).length
    const absent = attendance.filter(a => ['absent'].includes(text(a.status).toLowerCase())).length
    return { completed, overdue, activeProjects, income, expense, net: income - expense, pipeline, acceptedValue, goalItems, goalDone, clientActive, present, absent, taskRate: percent(completed, tasks.length), goalRate: percent(goalDone, goalItems), attendanceRate: percent(present, present + absent) }
  }, [tasks, projects, finance, quotations, goals, clients, attendance])

  const monthly = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const income = finance.filter(f => { const d = dateOf(f.date ?? f.createdAt); return d && d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && ['income', 'revenue', 'credit'].includes(text(f.type).toLowerCase()) }).reduce((s, f) => s + number(f.amount), 0)
      const expense = finance.filter(f => { const d = dateOf(f.date ?? f.createdAt); return d && d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && ['expense', 'debit', 'cost'].includes(text(f.type).toLowerCase()) }).reduce((s, f) => s + number(f.amount), 0)
      return { label: month.toLocaleDateString('en-IN', { month: 'short' }), income, expense }
    })
  }, [finance])

  const insights = useMemo(() => {
    const list: { icon: ReactNode; title: string; detail: string; tone: string }[] = []
    if (metrics.overdue) list.push({ icon: <AlertTriangle size={16} />, title: `${metrics.overdue} overdue task${metrics.overdue === 1 ? '' : 's'}`, detail: 'Review ownership and deadlines today.', tone: 'danger' })
    if (metrics.taskRate >= 75) list.push({ icon: <CheckCircle2 size={16} />, title: 'Execution is healthy', detail: `Task completion is at ${metrics.taskRate}%.`, tone: 'success' })
    else if (tasks.length) list.push({ icon: <Clock3 size={16} />, title: 'Execution needs attention', detail: `Only ${metrics.taskRate}% of tasks are complete.`, tone: 'warning' })
    if (metrics.pipeline) list.push({ icon: <CircleDollarSign size={16} />, title: 'Quotation pipeline', detail: `${money(metrics.pipeline)} is currently open or accepted.`, tone: 'accent' })
    if (metrics.net < 0) list.push({ icon: <TrendingDown size={16} />, title: 'Cash flow is negative', detail: `${money(Math.abs(metrics.net))} more expense than income recorded.`, tone: 'danger' })
    else list.push({ icon: <TrendingUp size={16} />, title: 'Positive cash flow', detail: `${money(metrics.net)} net cash flow recorded.`, tone: 'success' })
    if (metrics.goalItems && metrics.goalRate < 50) list.push({ icon: <Target size={16} />, title: 'Goals need a review', detail: `${metrics.goalRate}% of tracked goals are complete.`, tone: 'warning' })
    return list.slice(0, 5)
  }, [metrics, tasks.length])

  const maxChart = Math.max(1, ...monthly.flatMap(m => [m.income, m.expense]))
  if (loading) return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"><Card className="p-10 text-center text-sm text-[var(--os-text-muted)]">Loading analytics...</Card></div>

  return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
    <SectionHeader title="Analytics & Business Intelligence" description="A founder-level operating view connecting execution, finance, goals, clients and team health." />
    {error && <div role="alert" className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--os-danger)]/20 bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]"><AlertTriangle size={16} />{error}<button type="button" onClick={() => setError('')} className="ml-auto"><RefreshCw size={15} /></button></div>}

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Metric icon={<Wallet size={18} />} label="Revenue" value={money(metrics.income)} />
      <Metric icon={<Activity size={18} />} label="Net cash flow" value={money(metrics.net)} />
      <Metric icon={<FolderKanban size={18} />} label="Active projects" value={String(metrics.activeProjects)} />
      <Metric icon={<ListTodo size={18} />} label="Task completion" value={`${metrics.taskRate}%`} />
      <Metric icon={<Target size={18} />} label="Goal completion" value={`${metrics.goalRate}%`} />
      <Metric icon={<Users size={18} />} label="Active clients" value={String(metrics.clientActive)} />
    </div>

    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Financial trend</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">Six-month income vs expense snapshot from recorded finance entries.</p></div><BarChart3 size={18} className="text-[var(--os-accent)]" /></div>
        <div className="mt-7 flex h-56 items-end gap-3 sm:gap-5">{monthly.map(month => <div key={month.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="flex h-44 w-full items-end justify-center gap-1"><div title={`Income ${money(month.income)}`} className="w-1/3 rounded-t-md bg-[var(--os-accent)] transition-all" style={{ height: `${Math.max(4, month.income / maxChart * 100)}%` }} /><div title={`Expense ${money(month.expense)}`} className="w-1/3 rounded-t-md bg-[var(--os-text-muted)] opacity-60 transition-all" style={{ height: `${Math.max(4, month.expense / maxChart * 100)}%` }} /></div><span className="text-[10px] font-medium text-[var(--os-text-muted)]">{month.label}</span></div>)}</div>
        <div className="mt-4 flex gap-5 text-[11px] text-[var(--os-text-muted)]"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[var(--os-accent)]" />Income</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[var(--os-text-muted)]" />Expense</span></div>
      </Card>
      <Card className="p-5 sm:p-6"><h2 className="text-sm font-semibold text-[var(--os-text)]">Founder pulse</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">The few signals worth reviewing this week.</p><div className="mt-5 space-y-3">{insights.length ? insights.map((item, i) => <div key={`${item.title}-${i}`} className="flex gap-3 rounded-xl border border-[var(--os-border)] p-3"><span className="mt-0.5 text-[var(--os-accent)]">{item.icon}</span><div><p className="text-xs font-semibold text-[var(--os-text)]">{item.title}</p><p className="mt-1 text-[11px] leading-4 text-[var(--os-text-muted)]">{item.detail}</p></div></div>) : <p className="py-8 text-center text-xs text-[var(--os-text-muted)]">Add operational data to start generating insights.</p>}</div></Card>
    </div>

    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <HealthCard title="Execution health" icon={<ListTodo size={17} />} value={`${metrics.taskRate}%`} label={`${metrics.completed} completed of ${tasks.length} tasks`} progress={metrics.taskRate} extra={metrics.overdue ? `${metrics.overdue} overdue` : 'No overdue tasks detected'} />
      <HealthCard title="Goals & targets" icon={<Target size={17} />} value={`${metrics.goalRate}%`} label={`${metrics.goalDone} completed of ${metrics.goalItems} goals`} progress={metrics.goalRate} extra="Use Goals for target-level planning" />
      <HealthCard title="Team attendance" icon={<Clock3 size={17} />} value={`${metrics.attendanceRate}%`} label={`${metrics.present} present/late · ${metrics.absent} absent`} progress={metrics.attendanceRate} extra={`${leaves.length} leave records`} />
    </div>

    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><CircleDollarSign size={17} /></span><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Sales & quotations</h2><p className="text-xs text-[var(--os-text-muted)]">Current commercial pipeline</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><Stat label="Open pipeline" value={money(metrics.pipeline)} /><Stat label="Accepted value" value={money(metrics.acceptedValue)} /><Stat label="Quotations" value={String(quotations.length)} /><Stat label="Acceptance rate" value={`${percent(quotations.filter(q => text(q.status).toLowerCase() === 'accepted').length, quotations.length)}%`} /></div></Card>
      <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><BarChart3 size={17} /></span><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Business overview</h2><p className="text-xs text-[var(--os-text-muted)]">Workspace-wide operating totals</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><Stat label="Expenses" value={money(metrics.expense)} /><Stat label="Team members" value={String(members.filter(m => text(m.status).toLowerCase() === 'active' || !m.status).length)} /><Stat label="Projects" value={String(projects.length)} /><Stat label="Clients" value={String(clients.length)} /></div></Card>
    </div>

    <p className="mt-6 text-[11px] text-[var(--os-text-muted)]">Analytics is intentionally kept decision-focused: trends, targets and exceptions rather than a wall of metrics.</p>
  </div>
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <Card className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 truncate text-lg font-bold text-[var(--os-text)]">{value}</p></div></div></Card> }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[var(--os-surface-hover)] p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 text-sm font-bold text-[var(--os-text)]">{value}</p></div> }
function HealthCard({ title, icon, value, label, progress, extra }: { title: string; icon: ReactNode; value: string; label: string; progress: number; extra: string }) { return <Card className="p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-[var(--os-accent)]">{icon}</span><h2 className="text-sm font-semibold text-[var(--os-text)]">{title}</h2></div><span className="text-xl font-bold text-[var(--os-text)]">{value}</span></div><p className="mt-3 text-xs text-[var(--os-text-muted)]">{label}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-accent)] transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div><p className="mt-2 text-[10px] text-[var(--os-text-muted)]">{extra}</p></Card> }

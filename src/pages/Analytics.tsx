import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot, query, where, type DocumentData } from 'firebase/firestore'
import { Activity, AlertTriangle, BarChart3, BriefcaseBusiness, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, FolderKanban, ListTodo, Target, TrendingDown, TrendingUp, UserRoundCheck, Users, Wallet } from 'lucide-react'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'
import { subscribeToAttendance } from '../services/attendanceService'
import { subscribeToLeaveRequests } from '../services/leaveService'
import type { AttendanceRecord } from '../types/attendance'
import type { LeaveRequest } from '../types/leave'

type Row = DocumentData & { id: string }
const money = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`
const text = (v: unknown) => String(v ?? '')
const num = (v: unknown) => Number(v ?? 0) || 0
const pct = (v: number, total: number) => total ? Math.round(v / total * 100) : 0
const dateOf = (v: unknown) => { if (!v) return null; if (v instanceof Date) return v; if (typeof v === 'object' && v && 'toDate' in v && typeof (v as { toDate?: unknown }).toDate === 'function') return (v as { toDate: () => Date }).toDate(); const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? null : d }
const startDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

function useCollection(workspaceId: string | undefined, name: string) {
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => {
    if (!workspaceId) return undefined
    return onSnapshot(query(collection(db, name), where('workspaceId', '==', workspaceId)), snap => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() }))), error => console.warn(`${name} analytics unavailable`, error))
  }, [workspaceId, name])
  return rows
}

function useProtectedAttendance(workspaceId: string | undefined, userId: string | undefined, canView: boolean, canManage: boolean) {
  const [rows, setRows] = useState<AttendanceRecord[]>([])
  useEffect(() => {
    if (!workspaceId || !userId || !canView) return undefined
    return subscribeToAttendance(workspaceId, '2000-01-01', '2100-12-31', canManage, userId, setRows, error => console.warn('Attendance analytics unavailable', error))
  }, [workspaceId, userId, canView, canManage])
  return rows
}

function useProtectedLeaves(workspaceId: string | undefined, userId: string | undefined, canView: boolean, canManage: boolean) {
  const [rows, setRows] = useState<LeaveRequest[]>([])
  useEffect(() => {
    if (!workspaceId || !userId || !canView) return undefined
    return subscribeToLeaveRequests(workspaceId, userId, canManage, setRows, error => console.warn('Leave analytics unavailable', error))
  }, [workspaceId, userId, canView, canManage])
  return rows
}

export default function Analytics() {
  const { user } = useAuth()
  const { workspace, loading, hasPermission } = useWorkspace()
  const id = workspace?.id
  const attendanceView = hasPermission('attendance.view')
  const attendanceManage = hasPermission('attendance.manage')
  const attendance = useProtectedAttendance(id, user?.uid, attendanceView, attendanceManage)
  // Leave requests already enforce their own workspace/user access. Analytics only asks the service for the current user's records unless the user can manage leave.
  const leaveManage = hasPermission('leave.manage')
  const leaves = useProtectedLeaves(id, user?.uid, true, leaveManage)
  const projects = useCollection(id, 'projects')
  const tasks = useCollection(id, 'tasks')
  const finance = useCollection(id, 'financeEntries')
  const goals = useCollection(id, 'goals')
  const quotations = useCollection(id, 'quotations')
  const clients = useCollection(id, 'clients')
  const [members, setMembers] = useState<Row[]>([])

  useEffect(() => {
    if (!id) return undefined
    return onSnapshot(collection(db, 'workspaces', id, 'members'), snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))), error => console.warn('Member analytics unavailable', error))
  }, [id])

  const metrics = useMemo(() => {
    const today = startDay(new Date())
    const done = tasks.filter(t => ['completed', 'done'].includes(text(t.status).toLowerCase())).length
    const overdue = tasks.filter(t => !['completed', 'done'].includes(text(t.status).toLowerCase()) && (dateOf(t.dueDate) ?? dateOf(t.deadline)) && (dateOf(t.dueDate) ?? dateOf(t.deadline))! < today).length
    const activeProjects = projects.filter(p => !['completed', 'closed', 'cancelled'].includes(text(p.status).toLowerCase())).length
    const income = finance.filter(f => ['income', 'revenue', 'credit'].includes(text(f.type).toLowerCase())).reduce((s, f) => s + num(f.amount), 0)
    const expense = finance.filter(f => ['expense', 'debit', 'cost'].includes(text(f.type).toLowerCase())).reduce((s, f) => s + num(f.amount), 0)
    const accepted = quotations.filter(q => text(q.status).toLowerCase() === 'accepted')
    const pipeline = quotations.filter(q => !['rejected', 'expired'].includes(text(q.status).toLowerCase())).reduce((s, q) => s + num(q.totalAmount ?? q.total ?? q.amount), 0)
    const acceptedValue = accepted.reduce((s, q) => s + num(q.totalAmount ?? q.total ?? q.amount), 0)
    const goalDone = goals.filter(g => ['completed', 'done'].includes(text(g.status).toLowerCase()) || num(g.progress) >= 100).length
    const activeClients = clients.filter(c => !['inactive', 'archived'].includes(text(c.status).toLowerCase())).length
    const present = attendance.filter(a => ['present', 'late', 'half-day', 'halfday'].includes(a.status)).length
    const absent = attendance.filter(a => a.status === 'absent').length
    const leaveDays = leaves.reduce((sum, l) => { const a = new Date(`${l.startDate}T12:00:00`), b = new Date(`${l.endDate}T12:00:00`); return sum + (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) ? 0 : Math.max(1, Math.floor((b.getTime() - a.getTime()) / 86400000) + 1)) }, 0)
    const checkedOut = attendance.filter(a => a.checkOut).length
    const minutes = attendance.reduce((s, a) => s + (a.checkIn && a.checkOut ? Math.max(0, Math.round((a.checkOut.getTime() - a.checkIn.getTime()) / 60000)) : 0), 0)
    return { done, overdue, activeProjects, income, expense, net: income - expense, pipeline, acceptedValue, goalDone, goalItems: goals.length, activeClients, present, absent, leaveDays, leaveRequests: leaves.length, checkedOut, minutes, taskRate: pct(done, tasks.length), goalRate: pct(goalDone, goals.length), attendanceRate: pct(present, present + absent), quoteRate: pct(accepted.length, quotations.length) }
  }, [tasks, projects, finance, quotations, goals, clients, attendance, leaves])

  const monthly = useMemo(() => Array.from({ length: 6 }, (_, i) => { const now = new Date(); const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); const rows = finance.filter(f => { const x = dateOf(f.date ?? f.createdAt); return x && x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() }); const income = rows.filter(f => ['income', 'revenue', 'credit'].includes(text(f.type).toLowerCase())).reduce((s, f) => s + num(f.amount), 0); const expense = rows.filter(f => ['expense', 'debit', 'cost'].includes(text(f.type).toLowerCase())).reduce((s, f) => s + num(f.amount), 0); return { label: d.toLocaleDateString('en-IN', { month: 'short' }), income, expense, net: income - expense } }), [finance])
  const maxChart = Math.max(1, ...monthly.flatMap(m => [m.income, m.expense]))
  const projectStats = useMemo(() => ({ active: projects.filter(p => !['completed', 'closed', 'cancelled'].includes(text(p.status).toLowerCase())).length, completed: projects.filter(p => ['completed', 'closed'].includes(text(p.status).toLowerCase())).length, cancelled: projects.filter(p => text(p.status).toLowerCase() === 'cancelled').length }), [projects])
  const taskStats = useMemo(() => { const map = new Map<string, number>(); tasks.forEach(t => { const key = text(t.status).toLowerCase() || 'open'; map.set(key, (map.get(key) ?? 0) + 1) }); return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4) }, [tasks])
  const insights = useMemo(() => { const list: { icon: ReactNode; title: string; detail: string }[] = []; if (metrics.overdue) list.push({ icon: <AlertTriangle size={16} />, title: `${metrics.overdue} overdue task${metrics.overdue === 1 ? '' : 's'}`, detail: 'Review ownership and deadlines today.' }); if (metrics.net < 0) list.push({ icon: <TrendingDown size={16} />, title: 'Cash flow needs attention', detail: `${money(Math.abs(metrics.net))} more expense than income recorded.` }); else list.push({ icon: <TrendingUp size={16} />, title: 'Positive cash flow', detail: `${money(metrics.net)} net cash flow recorded.` }); if (metrics.quoteRate >= 50 && quotations.length) list.push({ icon: <CheckCircle2 size={16} />, title: 'Healthy quotation conversion', detail: `${metrics.quoteRate}% of quotations are accepted.` }); if (metrics.goalItems && metrics.goalRate < 50) list.push({ icon: <Target size={16} />, title: 'Goals need attention', detail: `Only ${metrics.goalRate}% of tracked goals are complete.` }); if (metrics.leaveDays) list.push({ icon: <CalendarDays size={16} />, title: `${metrics.leaveDays} leave day${metrics.leaveDays === 1 ? '' : 's'}`, detail: `${metrics.leaveRequests} leave request${metrics.leaveRequests === 1 ? '' : 's'} recorded.` }); return list.slice(0, 6) }, [metrics, quotations.length])

  if (loading) return <div className="mx-auto max-w-[1600px] p-6"><Card className="p-10 text-center text-sm text-[var(--os-text-muted)]">Loading analytics...</Card></div>
  return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
    <SectionHeader title="Analytics & Business Intelligence" description="A live founder command view across money, execution, growth, projects, people and operational risk." />
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><Metric icon={<Wallet size={18} />} label="Revenue" value={money(metrics.income)} /><Metric icon={<Activity size={18} />} label="Net cash flow" value={money(metrics.net)} /><Metric icon={<FolderKanban size={18} />} label="Active projects" value={String(metrics.activeProjects)} /><Metric icon={<ListTodo size={18} />} label="Task completion" value={`${metrics.taskRate}%`} /><Metric icon={<Target size={18} />} label="Goal completion" value={`${metrics.goalRate}%`} /><Metric icon={<Users size={18} />} label="Active clients" value={String(metrics.activeClients)} /></div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]"><Card className="p-5 sm:p-6"><PanelTitle icon={<BarChart3 size={17} />} title="Financial performance" subtitle="Six-month income vs expense trend" /><div className="mt-7 flex h-56 items-end gap-3 sm:gap-5">{monthly.map(m => <div key={m.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="flex h-44 w-full items-end justify-center gap-1"><div title={`Income ${money(m.income)}`} className="w-1/3 rounded-t-md bg-[var(--os-accent)]" style={{ height: `${Math.max(4, m.income / maxChart * 100)}%` }} /><div title={`Expense ${money(m.expense)}`} className="w-1/3 rounded-t-md bg-[var(--os-text-muted)] opacity-60" style={{ height: `${Math.max(4, m.expense / maxChart * 100)}%` }} /></div><span className="text-[10px] text-[var(--os-text-muted)]">{m.label}</span></div>)}</div><div className="mt-4 grid grid-cols-3 gap-3">{monthly.slice(-3).map(m => <Stat key={m.label} label={`${m.label} net`} value={money(m.net)} />)}</div></Card><Card className="p-5 sm:p-6"><PanelTitle icon={<Activity size={17} />} title="Founder pulse" subtitle="Automatic signals worth reviewing" /><div className="mt-5 space-y-3">{insights.length ? insights.map((i, n) => <div key={`${i.title}-${n}`} className="flex gap-3 rounded-xl border border-[var(--os-border)] p-3"><span className="mt-0.5 text-[var(--os-accent)]">{i.icon}</span><div><p className="text-xs font-semibold text-[var(--os-text)]">{i.title}</p><p className="mt-1 text-[11px] leading-4 text-[var(--os-text-muted)]">{i.detail}</p></div></div>) : <p className="py-8 text-center text-xs text-[var(--os-text-muted)]">Add operational data to generate insights.</p>}</div></Card></div>

    <div className="mt-5 grid gap-5 lg:grid-cols-4"><Health title="Execution" icon={<ListTodo size={17} />} value={`${metrics.taskRate}%`} detail={`${metrics.done}/${tasks.length} tasks complete`} progress={metrics.taskRate} footer={metrics.overdue ? `${metrics.overdue} overdue` : 'No overdue tasks'} /><Health title="Goals" icon={<Target size={17} />} value={`${metrics.goalRate}%`} detail={`${metrics.goalDone}/${metrics.goalItems} goals complete`} progress={metrics.goalRate} footer="Target health" /><Health title="Attendance" icon={<UserRoundCheck size={17} />} value={attendanceView ? `${metrics.attendanceRate}%` : '—'} detail={attendanceView ? `${metrics.present} present/late · ${metrics.absent} absent` : 'Restricted by permission'} progress={attendanceView ? metrics.attendanceRate : 0} footer={attendanceView ? `${metrics.checkedOut} checked out` : 'Using protected service'} /><Health title="Sales" icon={<CircleDollarSign size={17} />} value={money(metrics.pipeline)} detail={`${quotations.length} quotations`} progress={metrics.quoteRate} footer={`${metrics.quoteRate}% accepted`} /></div>

    <div className="mt-5 grid gap-5 lg:grid-cols-3"><Panel title="Project portfolio" icon={<BriefcaseBusiness size={17} />} stats={[['Active', String(projectStats.active)], ['Completed', String(projectStats.completed)], ['Cancelled', String(projectStats.cancelled)], ['Total', String(projects.length)]]} /><Panel title="Task workload" icon={<ListTodo size={17} />} stats={taskStats.map(([name, count]) => [name.replace(/-/g, ' '), String(count)])} /><Panel title="People & time" icon={<Clock3 size={17} />} stats={[["Team members", String(members.length)], ["Attendance records", attendanceView ? String(attendance.length) : 'Protected'], ["Work time", attendanceView ? `${Math.floor(metrics.minutes / 60)}h ${metrics.minutes % 60}m` : 'Protected'], ["Leave days", String(metrics.leaveDays)]]} /></div>

    <div className="mt-5 grid gap-5 lg:grid-cols-2"><Card className="p-5 sm:p-6"><PanelTitle icon={<CircleDollarSign size={17} />} title="Commercial intelligence" subtitle="Quotation pipeline and conversion" /><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Pipeline" value={money(metrics.pipeline)} /><Stat label="Accepted" value={money(metrics.acceptedValue)} /><Stat label="Quotes" value={String(quotations.length)} /><Stat label="Win rate" value={`${metrics.quoteRate}%`} /></div></Card><Card className="p-5 sm:p-6"><PanelTitle icon={<CalendarDays size={17} />} title="People operations" subtitle="Attendance, leave and team capacity" /><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Team" value={String(members.length)} /><Stat label="Present/late" value={attendanceView ? String(metrics.present) : '—'} /><Stat label="Leave days" value={String(metrics.leaveDays)} /><Stat label="Checked out" value={attendanceView ? String(metrics.checkedOut) : '—'} /></div></Card></div>

    <div className="mt-5 grid gap-5 lg:grid-cols-3"><Panel title="Cash position" icon={<Wallet size={17} />} stats={[["Income", money(metrics.income)], ["Expenses", money(metrics.expense)], ["Net", money(metrics.net)], ["Margin", metrics.income ? `${Math.round(metrics.net / metrics.income * 100)}%` : '0%']]} /><Panel title="Client & growth" icon={<Users size={17} />} stats={[["Active clients", String(metrics.activeClients)], ["Total clients", String(clients.length)], ["Active projects", String(metrics.activeProjects)], ["Accepted quotes", String(quotations.filter(q => text(q.status).toLowerCase() === 'accepted').length)]]} /><Panel title="Operational alerts" icon={<AlertTriangle size={17} />} stats={[["Overdue tasks", String(metrics.overdue)], ["Goal completion", `${metrics.goalRate}%`], ["Attendance", attendanceView ? `${metrics.attendanceRate}%` : 'Protected'], ["Leave requests", String(metrics.leaveRequests)]]} /></div>

    <p className="mt-6 text-[11px] text-[var(--os-text-muted)]">Protected data is intentionally read through the same permission-aware Attendance and Leave services used by their modules. This prevents Analytics from producing misleading permission errors or requiring broader Firestore access.</p>
  </div>
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <Card className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 truncate text-lg font-bold text-[var(--os-text)]">{value}</p></div></div></Card> }
function Health({ title, icon, value, detail, progress, footer }: { title: string; icon: ReactNode; value: string; detail: string; progress: number; footer: string }) { return <Card className="p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-[var(--os-accent)]">{icon}</span><h3 className="text-sm font-semibold text-[var(--os-text)]">{title}</h3></div><span className="text-xl font-bold text-[var(--os-text)]">{value}</span></div><p className="mt-3 text-[11px] text-[var(--os-text-muted)]">{detail}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-accent)]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div><p className="mt-2 text-[10px] font-medium text-[var(--os-text-muted)]">{footer}</p></Card> }
function PanelTitle({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) { return <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><div><h2 className="text-sm font-semibold text-[var(--os-text)]">{title}</h2><p className="text-xs text-[var(--os-text-muted)]">{subtitle}</p></div></div> }
function Panel({ title, icon, stats }: { title: string; icon: ReactNode; stats: [string, string][] }) { return <Card className="p-5 sm:p-6"><PanelTitle icon={icon} title={title} subtitle="Live operating breakdown" /><div className="mt-5 grid grid-cols-2 gap-3">{stats.map(([label, value]) => <Stat key={label} label={label} value={value} />)}</div></Card> }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-hover)] p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 text-sm font-bold capitalize text-[var(--os-text)]">{value}</p></div> }
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckSquare,
  CircleDollarSign,
  Globe,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type ProjectSnapshot = { id: string; name: string; status: string; projectValue: number; deadline: Date | null }
type TaskSnapshot = { id: string; title: string; status: string; priority: string; dueDate: Date | null }
type WebsiteSnapshot = { id: string; name: string; status: string }

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate() as Date
  return null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDueDate(date: Date | null) {
  if (!date) return 'No due date'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date)
}

function Dashboard() {
  const { user } = useAuth()
  const { workspace, member, loading: workspaceLoading, hasPermission } = useWorkspace()
  const isIntern = member?.role === 'intern'
  const financeVisible = hasPermission('finance.view')
  const clientsVisible = hasPermission('clients.view')
  const websitesVisible = hasPermission('websites.view')
  const projectsVisible = hasPermission('projects.view')
  const tasksVisible = hasPermission('tasks.view')
  const canCreateTask = hasPermission('tasks.create')
  const canCreateProject = hasPermission('projects.create')

  const [projects, setProjects] = useState<ProjectSnapshot[] | null>(null)
  const [tasks, setTasks] = useState<TaskSnapshot[] | null>(null)
  const [clientCount, setClientCount] = useState<number | null>(null)
  const [websites, setWebsites] = useState<WebsiteSnapshot[] | null>(null)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (workspaceLoading || !workspace?.id || !user?.uid) return undefined

    const workspaceId = workspace.id
    const userId = user.uid
    const handleError = (snapshotError: Error) => {
      console.error('Failed to load dashboard data:', snapshotError)
      setError('Some dashboard data could not be loaded. Please refresh and try again.')
    }

    const projectQuery = isIntern
      ? query(collection(db, 'projects'), where('workspaceId', '==', workspaceId), where('ownerId', '==', userId))
      : query(collection(db, 'projects'), where('workspaceId', '==', workspaceId))
    const taskQuery = isIntern
      ? query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId), where('assigneeId', '==', userId))
      : query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId))

    const unsubscribers: Array<() => void> = []

    if (projectsVisible) {
      unsubscribers.push(onSnapshot(projectQuery, (snapshot) => {
        setProjects(snapshot.docs.map((item) => { const data = item.data(); return { id: item.id, name: String(data.name ?? ''), status: String(data.status ?? 'planning'), projectValue: Number(data.projectValue ?? 0), deadline: toDate(data.deadline) } }))
      }, handleError))
    } else {
      setProjects([])
    }

    if (tasksVisible) {
      unsubscribers.push(onSnapshot(taskQuery, (snapshot) => {
        setTasks(snapshot.docs.map((item) => { const data = item.data(); return { id: item.id, title: String(data.title ?? ''), status: String(data.status ?? 'todo'), priority: String(data.priority ?? 'medium'), dueDate: toDate(data.dueDate) } }).filter((task) => !task.status.includes('cancelled')))
      }, handleError))
    } else {
      setTasks([])
    }

    if (clientsVisible && !isIntern) {
      unsubscribers.push(onSnapshot(query(collection(db, 'clients'), where('workspaceId', '==', workspaceId)), (snapshot) => setClientCount(snapshot.size), handleError))
    } else {
      setClientCount(0)
    }

    if (websitesVisible && !isIntern) {
      unsubscribers.push(onSnapshot(query(collection(db, 'websites'), where('workspaceId', '==', workspaceId)), (snapshot) => {
        setWebsites(snapshot.docs.map((item) => { const data = item.data(); return { id: item.id, name: String(data.name ?? ''), status: String(data.status ?? 'testing') } }))
      }, handleError))
    } else {
      setWebsites([])
    }

    if (financeVisible && !isIntern) {
      unsubscribers.push(onSnapshot(query(collection(db, 'financeEntries'), where('workspaceId', '==', workspaceId)), (snapshot) => {
        setRevenue(snapshot.docs.reduce((total, item) => { const data = item.data(); return data.type === 'income' ? total + Number(data.amount ?? 0) : total }, 0))
      }, handleError))
    } else {
      setRevenue(0)
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [workspace?.id, workspaceLoading, user?.uid, isIntern, projectsVisible, tasksVisible, clientsVisible, websitesVisible, financeVisible])

  const dashboardLoading = workspaceLoading || projects === null || tasks === null || (clientsVisible && !isIntern && clientCount === null) || (websitesVisible && !isIntern && websites === null) || (financeVisible && !isIntern && revenue === null)
  const activeProjects = useMemo(() => (projects ?? []).filter((project) => project.status !== 'completed' && project.status !== 'cancelled'), [projects])
  const pendingTasks = useMemo(() => (tasks ?? []).filter((task) => task.status !== 'completed' && task.status !== 'cancelled').sort((a, b) => { if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1; return a.dueDate.getTime() - b.dueDate.getTime() }), [tasks])
  const totalProjectValue = useMemo(() => (projects ?? []).reduce((total, project) => total + project.projectValue, 0), [projects])
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || (isIntern ? 'there' : 'Founder')
  const focusTitle = isIntern ? 'My Work Today' : "Today's Focus"
  const focusDescription = isIntern ? 'Tasks assigned to you and projects you are responsible for.' : 'The next tasks that need execution.'

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--os-accent)]">{isIntern ? 'My Workspace' : 'Founder Command Center'}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">{isIntern ? `Good to see you, ${firstName}.` : `Good to see you, ${firstName}.`}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)] sm:text-base">{isIntern ? 'A focused view of the work assigned to you. Workspace-wide business information stays with authorized roles.' : 'A live operational view of your workspace — what is active, what needs attention, and what is moving the business forward.'}</p>
          </div>
          {isIntern ? canCreateTask && <Button type="button" onClick={() => window.location.assign('/tasks')}><Plus size={17} />Create task</Button> : <Button type="button" onClick={() => window.location.assign('/tasks')}><Plus size={17} />Quick action</Button>}
        </div>
      </section>

      {error && <div role="alert" className="mb-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label={isIntern ? 'My Project Value' : 'Project Value'} value={dashboardLoading ? '—' : formatCurrency(totalProjectValue)} description={isIntern ? 'Value of projects assigned to you' : 'Total value across projects'} icon={<CircleDollarSign size={19} />} />
        {!isIntern && <StatCard label="Revenue" value={dashboardLoading ? '—' : financeVisible ? formatCurrency(revenue ?? 0) : 'Restricted'} description={financeVisible ? 'Recorded income' : 'Finance permission required'} icon={<TrendingUp size={19} />} />}
        <StatCard label={isIntern ? 'My Active Projects' : 'Active Projects'} value={dashboardLoading ? '—' : String(activeProjects.length)} description={isIntern ? 'Projects assigned to you' : 'Projects still in motion'} icon={<BriefcaseBusiness size={19} />} />
        <StatCard label={isIntern ? 'My Pending Tasks' : 'Pending Tasks'} value={dashboardLoading ? '—' : String(pendingTasks.length)} description={isIntern ? 'Your unfinished assigned tasks' : 'Tasks awaiting completion'} icon={<CheckSquare size={19} />} />
        {!isIntern && <StatCard label="Clients" value={dashboardLoading ? '—' : String(clientCount ?? 0)} description="Client relationships" icon={<Users size={19} />} />}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-6">
          <SectionHeader title={isIntern ? 'My Work Overview' : 'Business Overview'} description={isIntern ? 'Only your assigned projects and tasks are included in these figures.' : 'Live snapshot of the operating systems you have started using.'} action={<a href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--os-accent)] transition-colors hover:text-[var(--os-text)]">View projects<ArrowUpRight size={13} /></a>} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><BriefcaseBusiness size={18} /></span><div><p className="text-xs text-[var(--os-text-muted)]">{isIntern ? 'My active projects' : 'Active project pipeline'}</p><p className="mt-1 text-xl font-semibold text-[var(--os-text)]">{dashboardLoading ? '—' : activeProjects.length}</p></div></div></div>
            {!isIntern && <div className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Globe size={18} /></span><div><p className="text-xs text-[var(--os-text-muted)]">Websites & apps</p><p className="mt-1 text-xl font-semibold text-[var(--os-text)]">{dashboardLoading ? '—' : websites?.length ?? 0}</p></div></div></div>}
            <div className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><CheckSquare size={18} /></span><div><p className="text-xs text-[var(--os-text-muted)]">{isIntern ? 'My pending tasks' : 'Pending execution'}</p><p className="mt-1 text-xl font-semibold text-[var(--os-text)]">{dashboardLoading ? '—' : pendingTasks.length}</p></div></div></div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">{isIntern ? 'My project value' : 'Project value'}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)]">{dashboardLoading ? '—' : formatCurrency(totalProjectValue)}</p><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{isIntern ? 'Calculated only from projects assigned to your account.' : 'This becomes the foundation for revenue, expense and profitability intelligence.'}</p></div>
        </Card>

        <Card className="p-6">
          <SectionHeader title={focusTitle} description={focusDescription} action={<a href="/tasks" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--os-accent)] hover:text-[var(--os-text)]">View tasks<ArrowUpRight size={13} /></a>} />
          {dashboardLoading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-[var(--os-surface-raised)]" />)}</div> : pendingTasks.length === 0 ? <div className="mt-5"><EmptyState icon={<CheckSquare size={20} />} title={isIntern ? 'No assigned tasks' : 'Nothing competing for your attention'} description={isIntern ? 'When work is assigned to you, your tasks will appear here.' : 'Create tasks and assign them to your team when there is work to execute.'} /></div> : <div className="mt-5 space-y-2">{pendingTasks.slice(0, 4).map((task) => <a key={task.id} href={`/tasks/${task.id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3.5 transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]"><div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--os-text)]">{task.title}</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">{task.priority === 'urgent' ? 'Urgent · ' : ''}{task.status.replace('_', ' ')}</p></div><span className="shrink-0 text-xs font-medium text-[var(--os-text-muted)]">{formatDueDate(task.dueDate)}</span></a>)}</div>}
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><SectionHeader title={isIntern ? 'My Project Pulse' : 'Project Pulse'} description={isIntern ? 'Projects currently assigned to you.' : 'Projects that currently need the most operational attention.'} />{dashboardLoading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-[var(--os-surface-raised)]" />)}</div> : activeProjects.length === 0 ? <EmptyState title={isIntern ? 'No assigned projects yet' : 'No active projects yet'} description={isIntern ? 'Your assigned projects will appear here.' : 'Create a project to start tracking delivery, value and deadlines from the command center.'} /> : <div className="mt-5 space-y-2">{activeProjects.slice(0, 5).map((project) => <a key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3.5 hover:border-[var(--os-border-strong)]"><div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--os-text)]">{project.name}</p><p className="mt-1 text-xs capitalize text-[var(--os-text-muted)]">{project.status.replace('-', ' ')}</p></div><span className="shrink-0 text-sm font-semibold text-[var(--os-text)]">{formatCurrency(project.projectValue)}</span></a>)}</div>}</Card>

        <Card className="p-6"><SectionHeader title={isIntern ? 'My Quick Actions' : 'Quick Actions'} description={isIntern ? 'Actions available to your role.' : 'Jump directly into common founder workflows.'} /><div className="mt-5 grid gap-2 sm:grid-cols-2">{(isIntern ? [{ label: 'My tasks', description: 'View assigned work', icon: <CheckSquare size={17} />, href: '/tasks', visible: tasksVisible }, { label: 'My projects', description: 'View assigned projects', icon: <BriefcaseBusiness size={17} />, href: '/projects', visible: projectsVisible }] : [{ label: 'Create project', description: 'Start a new project', icon: <BriefcaseBusiness size={17} />, href: '/projects', visible: canCreateProject }, { label: 'Add client', description: 'Create a relationship', icon: <Users size={17} />, href: '/clients', visible: clientsVisible }, { label: 'Create task', description: 'Add something to execute', icon: <CheckSquare size={17} />, href: '/tasks', visible: canCreateTask }, { label: 'Websites & apps', description: 'Manage digital projects', icon: <Globe size={17} />, href: '/websites', visible: websitesVisible }]).filter((action) => action.visible).map((action) => <a key={action.label} href={action.href} className="group flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-left transition-all duration-200 hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)] transition-transform duration-200 group-hover:scale-105">{action.icon}</span><span className="min-w-0"><span className="block text-sm font-medium text-[var(--os-text)]">{action.label}</span><span className="mt-0.5 block text-xs text-[var(--os-text-muted)]">{action.description}</span></span></a>)}</div></Card>
      </section>
    </div>
  )
}

export default Dashboard

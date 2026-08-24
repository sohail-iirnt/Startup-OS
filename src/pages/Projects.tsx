import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CircleDollarSign, Edit3, FolderKanban, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import ProjectModal from '../components/projects/ProjectModal'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { getClients } from '../services/clientService'
import { getWorkspaceMemberDetails, getWorkspaceMembers } from '../services/memberService'
import { createProject, deleteProject, subscribeToProjects, updateProject } from '../services/projectService'
import type { Client } from '../types/client'
import type { CreateProjectInput, Project, ProjectPriority, ProjectStatus } from '../types/project'
import type { WorkspaceMember } from '../types/workspace'

const statusLabels: Record<ProjectStatus, string> = { planning: 'Planning', 'in-development': 'In Development', 'on-hold': 'On Hold', testing: 'Testing', completed: 'Completed', cancelled: 'Cancelled' }
const statusClasses: Record<ProjectStatus, string> = { planning: 'bg-[rgba(139,124,255,0.12)] text-[var(--os-accent)]', 'in-development': 'bg-[rgba(90,169,255,0.12)] text-[var(--os-info)]', 'on-hold': 'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]', testing: 'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]', completed: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]', cancelled: 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]' }
const priorityLabels: Record<ProjectPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
const priorityClasses: Record<ProjectPriority, string> = { low: 'text-[var(--os-text-muted)]', medium: 'text-[var(--os-text-secondary)]', high: 'text-[var(--os-warning)]', urgent: 'text-[var(--os-danger)]' }
type Filter = 'all' | ProjectStatus
function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) }
function dateText(date: Date | null) { return date ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : 'No deadline' }

function Projects() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const isIntern = !hasPermission('clients.view')
  const canSelectClient = hasPermission('clients.view')
  const canManageTeam = hasPermission('members.manage') || hasPermission('members.approve')
  const canCreate = hasPermission('projects.create')
  const canUpdate = hasPermission('projects.update')
  const canDelete = hasPermission('projects.delete')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [modalInstance, setModalInstance] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<Project | null>(null)

  useEffect(() => {
    if (workspaceLoading || !workspace?.id || !user?.uid) return
    let active = true
    setLoading(true); setError('')
    let unsubscribe: (() => void) | undefined
    async function start() {
      try {
        if (canSelectClient) {
          const [clientResult, memberResult] = await Promise.all([getClients(workspace.id), getWorkspaceMembers(workspace.id)])
          if (active) { setClients(clientResult); setMembers(memberResult) }
        } else {
          const ownMember = await getWorkspaceMemberDetails(workspace.id, user.uid)
          if (active) setMembers(ownMember ? [ownMember] : [])
        }
        unsubscribe = await subscribeToProjects(workspace.id, (next) => { if (active) { setProjects(next); setLoading(false); setError('') } }, (listenError) => { if (active) { setError(listenError.message); setLoading(false) } })
      } catch (loadError) {
        if (active) { setError(loadError instanceof Error ? loadError.message : 'Failed to load projects.'); setLoading(false) }
      }
    }
    void start()
    return () => { active = false; unsubscribe?.() }
  }, [workspace?.id, workspaceLoading, user?.uid, canSelectClient])

  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return projects.filter((p) => (filter === 'all' || p.status === filter) && (!q || [p.name, p.clientName, p.type, p.priority, p.ownerName].some((v) => v.toLowerCase().includes(q)))) }, [projects, search, filter])
  const stats = useMemo(() => ({ total: projects.length, active: projects.filter((p) => p.status === 'in-development').length, completed: projects.filter((p) => p.status === 'completed').length, value: projects.reduce((sum, p) => sum + p.projectValue, 0) }), [projects])

  function openCreate() { setError(''); setEditing(null); setModalInstance((v) => v + 1); setModalOpen(true) }
  function openEdit(p: Project) { setError(''); setEditing(p); setModalInstance((v) => v + 1); setModalOpen(true) }

  async function save(input: CreateProjectInput) {
    if (!workspace?.id || !user?.uid) throw new Error('Workspace or user is not available.')
    setSaving(true); setError('')
    try {
      const prepared = isIntern && !editing ? { ...input, ownerId: user.uid, ownerName: members[0]?.displayName || user.displayName || user.email || 'You', memberIds: Array.from(new Set([...(input.memberIds || []), user.uid])) } : input
      if (editing) await updateProject(editing.id, workspace.id, prepared)
      else await createProject(workspace.id, prepared)
      setModalOpen(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save project.'); throw e } finally { setSaving(false) }
  }

  async function confirmDelete() {
    if (!toDelete || !workspace?.id) return
    setDeleting(true); setError('')
    try { await deleteProject(toDelete.id, workspace.id); setToDelete(null) } catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete project.') } finally { setDeleting(false) }
  }

  return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
    <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Execution</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">{isIntern ? 'My Projects' : 'Projects'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)]">{isIntern ? 'Projects assigned to you and your current delivery workload.' : 'Your project command center for delivery, deadlines, ownership, value, and progress.'}</p></div>{canCreate && <Button type="button" onClick={openCreate} disabled={workspaceLoading || !workspace?.id}><Plus size={16} /> New Project</Button>}</section>
    {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label={isIntern ? 'My Projects' : 'Total Projects'} value={String(stats.total)} icon={<FolderKanban size={18} />} /><Stat label="In Development" value={String(stats.active)} icon={<CalendarClock size={18} />} /><Stat label="Completed" value={String(stats.completed)} icon={<CircleDollarSign size={18} />} /><Stat label={isIntern ? 'My Project Value' : 'Project Value'} value={money(stats.value)} icon={<CircleDollarSign size={18} />} /></div>
    <Card className="mb-5 p-4"><div className="grid gap-3 lg:grid-cols-[1fr_auto]"><div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-[var(--os-text-muted)]" /><Input aria-label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project, client, owner, type, or priority..." className="pl-10" /></div><div className="flex flex-wrap gap-2">{(['all', 'planning', 'in-development', 'on-hold', 'testing', 'completed', 'cancelled'] as Filter[]).map((s) => <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${filter === s ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]'}`}>{s === 'all' ? 'All' : statusLabels[s]}</button>)}</div></div></Card>
    {loading || workspaceLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((i) => <Card key={i} className="h-56 animate-pulse bg-[var(--os-surface-hover)]" />)}</div> : filtered.length === 0 ? <EmptyState icon={<FolderKanban size={22} />} title={projects.length ? 'No projects match your filters' : isIntern ? 'No projects assigned yet' : 'No projects yet'} description={projects.length ? 'Try a different search or status filter.' : isIntern ? 'A manager or admin can assign you to a project, or you can create an internal project.' : 'Create your first project and connect it to a client.'} action={!projects.length && canCreate ? <Button type="button" onClick={openCreate}><Plus size={16} /> New Project</Button> : undefined} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((project) => <Card key={project.id} className="group p-5 transition-transform hover:-translate-y-0.5"><button type="button" onClick={() => navigate(`/projects/${project.id}`)} className="block w-full text-left"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><FolderKanban size={20} /></span><div className="min-w-0"><h2 className="truncate text-base font-semibold text-[var(--os-text)]">{project.name}</h2><p className="truncate text-xs text-[var(--os-text-secondary)]">{project.scope === 'internal' ? 'Internal project' : project.clientName || 'External project — client pending'}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[project.status]}`}>{statusLabels[project.status]}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Value</p><p className="mt-1 text-sm font-semibold text-[var(--os-text)]">{money(project.projectValue)}</p></div><div><p className="text-[10px] uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Priority</p><p className={`mt-1 text-sm font-semibold ${priorityClasses[project.priority]}`}>{priorityLabels[project.priority]}</p></div></div><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--os-text-secondary)]"><CalendarClock size={14} /> {dateText(project.deadline)}<span className="mx-1">•</span><UserRound size={14} /> {project.ownerName || 'Unassigned'}</div></button><div className="mt-5 flex justify-end gap-2 border-t border-[var(--os-border)] pt-4">{canUpdate && <Button type="button" variant="secondary" onClick={() => openEdit(project)}><Edit3 size={14} /> Edit</Button>}{canDelete && <Button type="button" variant="secondary" onClick={() => setToDelete(project)}><Trash2 size={14} /> Delete</Button>}</div></Card>)}</div>}
    <ProjectModal key={`project-modal-${modalInstance}`} open={modalOpen} project={editing} clients={clients} members={members} canSelectClient={canSelectClient} canManageTeam={canManageTeam} saving={saving} onClose={() => !saving && setModalOpen(false)} onSubmit={save} />
    <ConfirmDialog open={Boolean(toDelete)} title="Delete project?" description={toDelete ? <>You are about to permanently delete <strong>{toDelete.name}</strong>. This cannot be undone.</> : ''} confirmLabel="Delete Project" loading={deleting} onCancel={() => !deleting && setToDelete(null)} onConfirm={confirmDelete} />
  </div>
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <Card className="p-4"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><span className="text-xl font-semibold text-[var(--os-text)]">{value}</span></div><p className="mt-3 text-xs font-medium text-[var(--os-text-muted)]">{label}</p></Card> }
export default Projects

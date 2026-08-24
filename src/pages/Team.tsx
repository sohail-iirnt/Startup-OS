import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Filter, Mail, Search, ShieldCheck, UserPlus, UserRound, Users, Workflow, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import InviteMemberModal from '../components/members/InviteMemberModal'
import { useWorkspace } from '../context/useWorkspace'
import { getWorkspaceMembers } from '../services/memberService'
import { getTasks } from '../services/taskService'
import type { Task } from '../types/task'
import type { WorkspaceMember } from '../types/workspace'

function initials(member: WorkspaceMember) { const source = member.displayName || member.email || 'Member'; return source.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'M' }
function roleLabel(role: string) { return role.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function isOverdue(task: Task) { return !!task.dueDate && task.status !== 'completed' && task.status !== 'cancelled' && task.dueDate.getTime() < Date.now() }

function Team() {
  const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function loadTeamData() {
      if (workspaceLoading || !workspace?.id) return
      setLoading(true); setError('')
      try {
        const [memberResult, taskResult] = await Promise.all([getWorkspaceMembers(workspace.id), getTasks(workspace.id)])
        if (!cancelled) { setMembers(memberResult); setTasks(taskResult) }
      } catch (loadError: unknown) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load team workload.')
      } finally { if (!cancelled) setLoading(false) }
    }
    void loadTeamData()
    return () => { cancelled = true }
  }, [workspace?.id, workspaceLoading])

  const assignedTasks = tasks.filter((task) => task.assigneeId)
  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
  const completedTasks = tasks.filter((task) => task.status === 'completed')
  const overdueTasks = tasks.filter(isOverdue)
  const unassignedTasks = tasks.filter((task) => !task.assigneeId)
  function memberTasks(memberId: string) { return tasks.filter((task) => task.assigneeId === memberId) }
  const canInviteMembers = hasPermission('members.manage') || hasPermission('members.approve')
  const roles = useMemo(() => Array.from(new Set(members.map((member) => member.role))).sort(), [members])
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return members.filter((member) => {
      const matchesSearch = !query || [member.displayName, member.email, member.designation, member.role].filter(Boolean).some((value) => value!.toLowerCase().includes(query))
      return matchesSearch && (roleFilter === 'all' || member.role === roleFilter)
    })
  }, [members, roleFilter, search])
  const hasFilters = !!search || roleFilter !== 'all'
  function clearFilters() { setSearch(''); setRoleFilter('all') }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Access</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Team</h1><p className="mt-2 max-w-3xl text-sm text-[var(--os-text-secondary)]">Registered workspace members and their current operational workload. Members can be assigned tasks and will become the ownership layer for projects, goals, and other Startup OS operations.</p></div>
        {canInviteMembers && workspace && <button type="button" onClick={() => setInviteOpen(true)} className="os-focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(139,124,255,0.18)] transition-colors hover:bg-[var(--os-accent-hover)]"><UserPlus size={16} /> Invite Member</button>}
      </section>
      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5"><div className="flex items-center gap-3"><Users size={20} className="text-[var(--os-accent)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Active Members</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{members.length}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><Workflow size={20} className="text-[var(--os-info)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Active Tasks</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{activeTasks.length}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-[var(--os-success)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Completed Tasks</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{completedTasks.length}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><Clock3 size={20} className="text-[var(--os-warning)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Overdue Tasks</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{overdueTasks.length}</p></div></div></Card>
      </div>
      <Card className="mb-5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Work Allocation</h2><p className="mt-1 text-xs text-[var(--os-text-secondary)]">{assignedTasks.length} assigned tasks · {unassignedTasks.length} unassigned tasks · {tasks.length} total tasks</p></div><div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-accent)] transition-all" style={{ width: `${tasks.length ? Math.min(100, (assignedTasks.length / tasks.length) * 100) : 0}%` }} /></div></div></Card>
      <div className="mb-5"><Card className="p-5"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[var(--os-success)]" /><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Workspace</h2><p className="mt-0.5 text-xs text-[var(--os-text-secondary)]">{workspace?.name || 'Loading...'}</p></div></div></Card></div>
      <Card className="mb-5 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2"><Filter size={17} className="text-[var(--os-accent)]" /><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Member Directory</h2><p className="mt-0.5 text-xs text-[var(--os-text-secondary)]">Showing {filteredMembers.length} of {members.length} active members</p></div></div>{hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-[var(--os-accent)] hover:text-[var(--os-accent-hover)]">Clear filters <X size={14} /></button>}</div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]"><label className="relative block"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, role or designation..." className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-10 pr-3 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]" /></label><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="os-focus-ring h-11 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"><option value="all">All roles</option>{roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></div>
      </Card>
      {loading || workspaceLoading ? <Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">Loading team members and workload...</Card> : filteredMembers.length === 0 ? <Card className="p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserRound size={22} /></div><h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">{hasFilters ? 'No members match your filters' : 'No active members yet'}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--os-text-secondary)]">{hasFilters ? 'Try changing the search or role filter to find another workspace member.' : 'Registered workspace members will appear here and can then be selected as assignees throughout Startup OS.'}</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-5 rounded-xl border border-[var(--os-border)] px-4 py-2 text-sm font-semibold text-[var(--os-text)] hover:bg-[var(--os-surface-hover)]">Clear filters</button>}</Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredMembers.map((member) => {
          const memberTaskList = memberTasks(member.id)
          const memberActiveTasks = memberTaskList.filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
          const memberCompletedTasks = memberTaskList.filter((task) => task.status === 'completed')
          const memberOverdueTasks = memberTaskList.filter(isOverdue)
          const completionRate = memberTaskList.length ? Math.round((memberCompletedTasks.length / memberTaskList.length) * 100) : 0
          return <Link key={member.id} to={`/team/${member.userId}`} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--os-accent)]"><Card className="h-full p-5 transition-colors hover:border-[var(--os-border-strong)]">
            <div className="flex items-start gap-4">{member.photoURL ? <img src={member.photoURL} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-sm font-bold text-[var(--os-accent)]">{initials(member)}</div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-base font-semibold text-[var(--os-text)]">{member.displayName || 'Unnamed member'}</h2><span className="shrink-0 rounded-full bg-[var(--os-success-soft)] px-2 py-1 text-[10px] font-semibold capitalize text-[var(--os-success)]">Active</span></div><p className="mt-1 text-xs font-medium text-[var(--os-accent)]">{member.designation || roleLabel(member.role)}</p></div></div>
            <div className="mt-5 space-y-3">{member.email && <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--os-text-secondary)]"><Mail size={15} className="shrink-0 text-[var(--os-text-muted)]" /><span className="truncate">{member.email}</span></div>}<div className="grid grid-cols-3 gap-2 border-t border-[var(--os-border)] pt-4"><div className="rounded-xl bg-[var(--os-surface-raised)] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--os-text-muted)]">Active</p><p className="mt-1 text-lg font-semibold text-[var(--os-text)]">{memberActiveTasks.length}</p></div><div className="rounded-xl bg-[var(--os-surface-raised)] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--os-text-muted)]">Done</p><p className="mt-1 text-lg font-semibold text-[var(--os-text)]">{memberCompletedTasks.length}</p></div><div className="rounded-xl bg-[var(--os-surface-raised)] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--os-text-muted)]">Overdue</p><p className="mt-1 text-lg font-semibold text-[var(--os-danger)]">{memberOverdueTasks.length}</p></div></div><div className="border-t border-[var(--os-border)] pt-3"><div className="flex items-center justify-between gap-3"><span className="text-xs text-[var(--os-text-muted)]">Task completion</span><span className="text-xs font-semibold text-[var(--os-text-secondary)]">{completionRate}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-success)] transition-all" style={{ width: `${completionRate}%` }} /></div></div><div className="flex items-center justify-between gap-3 border-t border-[var(--os-border)] pt-3"><span className="text-xs text-[var(--os-text-muted)]">Role</span><span className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--os-text-secondary)]">{roleLabel(member.role)}</span></div><p className="pt-1 text-xs font-medium text-[var(--os-accent)]">Open member profile →</p></div>
          </Card></Link>
        })}
      </div>}
      {workspace && <InviteMemberModal open={inviteOpen} workspaceId={workspace.id} workspaceName={workspace.name} onClose={() => setInviteOpen(false)} />}
    </div>
  )
}
export default Team

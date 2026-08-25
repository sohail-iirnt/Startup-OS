import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Filter, Mail, Search, ShieldCheck, UserPlus, UserRound, Users, Workflow, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import InviteMemberModal from '../components/members/InviteMemberModal'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { approveWorkspaceMember, rejectWorkspaceMember, subscribeToPendingWorkspaceMembers, getWorkspaceMemberDetails, getWorkspaceMembers } from '../services/workspaceService'
import { subscribeToTasks } from '../services/taskService'
import type { Task } from '../types/task'
import type { WorkspaceMember } from '../types/workspace'

function initials(member: WorkspaceMember) { const source = member.displayName || member.email || 'Member'; return source.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'M' }
function roleLabel(role: string) { return role.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) }
function isOverdue(task: Task) { return !!task.dueDate && task.status !== 'completed' && task.status !== 'cancelled' && task.dueDate.getTime() < new Date().getTime() }

function Team() {
  const { user } = useAuth()
  const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const canApprove = hasPermission('members.approve') || hasPermission('members.manage')
  const canInviteMembers = canApprove
  const isIntern = !canApprove && hasPermission('projects.create')
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<WorkspaceMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [approvalLoading, setApprovalLoading] = useState('')
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if (workspaceLoading || !workspace?.id || !user?.uid) return undefined
    const workspaceId = workspace.id
    const userId = user.uid
    let active = true
    let unsubscribeTasks: (() => void) | undefined
    let unsubscribePending: (() => void) | undefined
    async function start() {
      try {
        const memberResult = isIntern ? await getWorkspaceMemberDetails(workspaceId, userId) : await getWorkspaceMembers(workspaceId)
        if (!active) return
        setMembers(memberResult ? (Array.isArray(memberResult) ? memberResult : [memberResult]) : [])
        unsubscribeTasks = await subscribeToTasks(workspaceId, next => { if (active) { setTasks(next); setLoading(false); setError('') } }, listenError => { if (active) { setError(listenError.message); setLoading(false) } })
        if (canApprove) {
          unsubscribePending = subscribeToPendingWorkspaceMembers(workspaceId, next => { if (active) setPendingMembers(next) }, listenError => { if (active) setError(listenError.message) })
        } else if (active) {
          setPendingMembers([])
        }
        if (active) setLoading(false)
      } catch (loadError) {
        if (active) { setError(loadError instanceof Error ? loadError.message : 'Unable to load team workload.'); setLoading(false) }
      }
    }
    void start()
    return () => { active = false; unsubscribeTasks?.(); unsubscribePending?.() }
  }, [workspace?.id, workspaceLoading, user?.uid, isIntern, canApprove])

  const assignedTasks = tasks.filter(task => task.assigneeId)
  const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled')
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const overdueTasks = tasks.filter(isOverdue)
  const unassignedTasks = tasks.filter(task => !task.assigneeId)
  function memberTasks(memberId: string) { return tasks.filter(task => task.assigneeId === memberId) }
  const roles = useMemo(() => Array.from(new Set(members.map(member => member.role))).sort(), [members])
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return members.filter(member => {
      const matchesSearch = !query || [member.displayName, member.email, member.designation, member.role].filter(Boolean).some(value => value!.toLowerCase().includes(query))
      return matchesSearch && (roleFilter === 'all' || member.role === roleFilter)
    })
  }, [members, roleFilter, search])

  async function approve(member: WorkspaceMember) {
    if (!workspace?.id || !canApprove) return
    setApprovalLoading(member.id); setError('')
    try {
      await approveWorkspaceMember(workspace.id, member.userId, member.role)
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : 'Unable to approve this member.')
    } finally { setApprovalLoading('') }
  }

  async function reject(member: WorkspaceMember) {
    if (!workspace?.id || !canApprove) return
    setApprovalLoading(member.id); setError('')
    try {
      await rejectWorkspaceMember(workspace.id, member.userId)
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Unable to reject this member.')
    } finally { setApprovalLoading('') }
  }

  return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
    <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Access</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">{isIntern ? 'My Profile' : 'Team'}</h1><p className="mt-2 max-w-3xl text-sm text-[var(--os-text-secondary)]">{isIntern ? 'Your workspace identity and your assigned workload. Workspace-wide member data is restricted.' : 'Registered workspace members, pending approvals and current operational workload.'}</p></div>{canInviteMembers && workspace && <button type="button" onClick={() => setInviteOpen(true)} className="os-focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white"><UserPlus size={16} /> Invite Member</button>}</section>
    {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card className="p-5"><div className="flex items-center gap-3"><Users size={20} className="text-[var(--os-accent)]" /><div><p className="text-xs text-[var(--os-text-muted)]">{isIntern ? 'My Membership' : 'Active Members'}</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{isIntern ? 'Active' : members.length}</p></div></div></Card><Card className="p-5"><div className="flex items-center gap-3"><Workflow size={20} className="text-[var(--os-info)]" /><div><p className="text-xs text-[var(--os-text-muted)]">My Active Tasks</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{activeTasks.length}</p></div></div></Card><Card className="p-5"><div className="flex items-center gap-3"><CheckCircle2 className="text-[var(--os-success)]" size={20} /><div><p className="text-xs text-[var(--os-text-muted)]">My Completed</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{completedTasks.length}</p></div></div></Card><Card className="p-5"><div className="flex items-center gap-3"><Clock3 className="text-[var(--os-warning)]" size={20} /><div><p className="text-xs text-[var(--os-text-muted)]">My Overdue</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{overdueTasks.length}</p></div></div></Card></div>

    {!isIntern && canApprove && <Card className="mb-5 overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--os-border)] px-5 py-4 sm:px-6"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Pending member approvals</h2><p className="mt-1 text-xs text-[var(--os-text-secondary)]">New registrations and invited members appear here in realtime.</p></div><span className="rounded-full bg-[var(--os-warning-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--os-warning)]">{pendingMembers.length} pending</span></div>{pendingMembers.length === 0 ? <div className="p-6 text-center text-sm text-[var(--os-text-muted)]">No members are waiting for approval.</div> : <div className="divide-y divide-[var(--os-border)]">{pendingMembers.map(member => <div key={member.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Clock3 size={17} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--os-text)]">{member.displayName || member.email || 'Pending member'}</p><p className="truncate text-xs text-[var(--os-text-secondary)]">{member.email} · Requested role: {roleLabel(member.role)}</p></div></div><div className="flex gap-2"><button type="button" disabled={approvalLoading === member.id} onClick={() => void reject(member)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--os-border)] px-3 text-xs font-semibold text-[var(--os-danger)] disabled:opacity-50"><XCircle size={14} /> Reject</button><button type="button" disabled={approvalLoading === member.id} onClick={() => void approve(member)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--os-success)] px-3 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={14} /> {approvalLoading === member.id ? 'Updating…' : 'Approve'}</button></div></div>)}</div>}</Card>}

    {!isIntern && <><Card className="mb-5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Work Allocation</h2><p className="mt-1 text-xs text-[var(--os-text-secondary)]">{assignedTasks.length} assigned tasks · {unassignedTasks.length} unassigned tasks · {tasks.length} total tasks</p></div><div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-accent)]" style={{ width: `${tasks.length ? Math.min(100, (assignedTasks.length / tasks.length) * 100) : 0}%` }} /></div></div></Card><Card className="mb-5 p-5"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[var(--os-success)]" /><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Workspace</h2><p className="mt-0.5 text-xs text-[var(--os-text-secondary)]">{workspace?.name || 'Loading...'}</p></div></div></Card><Card className="mb-5 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Filter size={17} className="text-[var(--os-accent)]" /><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Member Directory</h2><p className="mt-0.5 text-xs text-[var(--os-text-secondary)]">Showing {filteredMembers.length} of {members.length} active members</p></div></div><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]"><label className="relative block"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email, role or designation..." className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-10 pr-3 text-sm text-[var(--os-text)]" /></label><select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="os-focus-ring h-11 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"><option value="all">All roles</option>{roles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></div></Card></>}

    {loading || workspaceLoading ? <Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">Loading {isIntern ? 'your profile and workload' : 'team members and workload'}...</Card> : filteredMembers.length === 0 ? <Card className="p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserRound size={22} /></div><h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">No member profile available</h2></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredMembers.map(member => { const memberTaskList = memberTasks(member.userId); const memberActiveTasks = memberTaskList.filter(task => task.status !== 'completed' && task.status !== 'cancelled'); const memberCompletedTasks = memberTaskList.filter(task => task.status === 'completed'); const memberOverdueTasks = memberTaskList.filter(isOverdue); const completionRate = memberTaskList.length ? Math.round((memberCompletedTasks.length / memberTaskList.length) * 100) : 0; return <Link key={member.id} to={`/team/${member.userId}`} className="block rounded-2xl"><Card className="h-full p-5"><div className="flex items-start gap-4">{member.photoURL ? <img src={member.photoURL} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-sm font-bold text-[var(--os-accent)]">{initials(member)}</div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-base font-semibold text-[var(--os-text)]">{member.displayName || 'Unnamed member'}</h2><span className="shrink-0 rounded-full bg-[var(--os-success-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--os-success)]">Active</span></div><p className="mt-1 text-xs font-medium text-[var(--os-accent)]">{member.designation || roleLabel(member.role)}</p></div></div><div className="mt-5 space-y-3">{member.email && <div className="flex items-center gap-2 text-sm text-[var(--os-text-secondary)]"><Mail size={15} /><span className="truncate">{member.email}</span></div>}<div className="grid grid-cols-3 gap-2 border-t border-[var(--os-border)] pt-4"><div className="rounded-xl bg-[var(--os-surface-raised)] p-3"><p className="text-[10px] font-semibold uppercase text-[var(--os-text-muted)]">Active</p><p className="mt-1 text-lg font-semibold text-[var(--os-text)]">{memberActiveTasks.length}</p></div><div className="rounded-xl bg-[var(--os-surface-raised)] p-3"><p className="text-[10px] font-semibold uppercase text-[var(--os-text-muted)]">Done</p><p className="mt-1 text-lg font-semibold text-[var(--os-text)]">{memberCompletedTasks.length}</p></div><div className="rounded-xl bg-[var(--os-surface-raised)] p-3"><p className="text-[10px] font-semibold uppercase text-[var(--os-text-muted)]">Overdue</p><p className="mt-1 text-lg font-semibold text-[var(--os-danger)]">{memberOverdueTasks.length}</p></div></div><div className="border-t border-[var(--os-border)] pt-3"><div className="flex items-center justify-between"><span className="text-xs text-[var(--os-text-muted)]">Task completion</span><span className="text-xs font-semibold text-[var(--os-text-secondary)]">{completionRate}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-success)]" style={{ width: `${completionRate}%` }} /></div></div><div className="flex items-center justify-between border-t border-[var(--os-border)] pt-3"><span className="text-xs text-[var(--os-text-muted)]">Role</span><span className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-xs font-medium text-[var(--os-text-secondary)]">{roleLabel(member.role)}</span></div><p className="pt-1 text-xs font-medium text-[var(--os-accent)]">Open member profile →</p></div></Card></Link> })}</div>}
    {workspace && <InviteMemberModal open={inviteOpen} workspaceId={workspace.id} workspaceName={workspace.name} onClose={() => setInviteOpen(false)} />}
  </div>
}
export default Team

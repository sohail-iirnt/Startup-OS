import { useEffect, useState } from 'react'
import { Check, ShieldCheck, UserRound, X } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { approveMember, rejectMember } from '../services/memberService'
import { subscribeToPendingWorkspaceMembers } from '../services/workspaceService'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'

function normalizeRole(role: string | undefined): string {
  const value = String(role ?? '').trim().toLowerCase()
  if (value === 'owner') return 'owner'
  if (value === 'admin' || value === 'administrator') return 'admin'
  if (value === 'manager') return 'manager'
  return value
}

function MemberApprovals() {
  const { user } = useAuth()
  const { workspace, member: currentMember, loading: workspaceLoading, hasPermission } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [roles, setRoles] = useState<Record<string, UserRole>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const currentRole = normalizeRole(currentMember?.role)
  const isOwner = Boolean(user?.uid && workspace?.ownerId === user.uid) || currentRole === 'owner'
  const isAdmin = currentRole === 'admin'
  const canApprove = isOwner || isAdmin || hasPermission('members.approve')
  const canAssignElevatedRoles = isOwner || isAdmin

  useEffect(() => {
    const workspaceId = workspace?.id
    if (workspaceLoading || !workspaceId || !canApprove) return undefined

    return subscribeToPendingWorkspaceMembers(
      workspaceId,
      (nextMembers) => {
        setMembers(nextMembers)
        setRoles((current) => {
          const next = { ...current }
          nextMembers.forEach((item) => {
            if (!next[item.id]) {
              next[item.id] = item.role === 'member' || item.role === 'viewer' || item.role === 'manager' || item.role === 'intern' ? item.role : 'intern'
            }
          })
          Object.keys(next).forEach((id) => {
            if (!nextMembers.some((item) => item.id === id)) delete next[id]
          })
          return next
        })
        setLoading(false)
        setError('')
      },
      (listenError) => {
        setError(listenError.message)
        setLoading(false)
      },
    )
  }, [workspace?.id, workspaceLoading, canApprove])

  async function handleApprove(pendingMember: WorkspaceMember) {
    if (!workspace?.id || savingId) return
    setSavingId(pendingMember.id)
    setError('')
    try {
      await approveMember(workspace.id, pendingMember.userId, roles[pendingMember.id] ?? 'intern')
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Unable to approve member.')
    } finally {
      setSavingId('')
    }
  }

  async function handleReject(pendingMember: WorkspaceMember) {
    if (!workspace?.id || savingId) return
    setSavingId(pendingMember.id)
    setError('')
    try {
      await rejectMember(workspace.id, pendingMember.userId)
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Unable to reject member.')
    } finally {
      setSavingId('')
    }
  }

  if (!canApprove && !workspaceLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-10 text-center">
          <ShieldCheck className="mx-auto text-[var(--os-danger)]" size={28} />
          <h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">Access restricted</h1>
          <p className="mt-2 text-sm text-[var(--os-text-secondary)]">Only workspace owners, admins and authorized managers can approve member requests.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Access</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Member Approvals</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--os-text-secondary)]">Review new registration requests, choose their final role, and grant only the access appropriate for their responsibility. This queue updates live.</p>
      </section>

      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      {loading || workspaceLoading ? (
        <Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">Loading member requests...</Card>
      ) : members.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-success-soft)] text-[var(--os-success)]"><Check size={22} /></div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">No pending requests</h2>
          <p className="mt-2 text-sm text-[var(--os-text-secondary)]">New workspace registrations will appear here automatically.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {members.map((pendingMember) => (
            <Card key={pendingMember.id} className="p-5">
              <div className="flex items-start gap-4">
                {pendingMember.photoURL ? <img src={pendingMember.photoURL} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserRound size={20} /></div>}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-[var(--os-text)]">{pendingMember.displayName || 'Workspace Member'}</h2>
                  <p className="mt-1 truncate text-sm text-[var(--os-text-secondary)]">{pendingMember.email || 'No email available'}</p>
                  <p className="mt-1 text-xs text-[var(--os-text-muted)]">Requested: <span className="capitalize">{pendingMember.role}</span></p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div>
                  <label htmlFor={`role-${pendingMember.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">Final role</label>
                  <select id={`role-${pendingMember.id}`} value={roles[pendingMember.id] ?? 'intern'} onChange={(event) => setRoles((current) => ({ ...current, [pendingMember.id]: event.target.value as UserRole }))} disabled={savingId === pendingMember.id} className="h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]">
                    <option value="intern">Intern</option><option value="member">Member</option><option value="viewer">Viewer</option>{canAssignElevatedRoles && <option value="manager">Manager</option>}
                  </select>
                </div>
                <Button type="button" onClick={() => void handleApprove(pendingMember)} disabled={savingId === pendingMember.id}><Check size={15} />{savingId === pendingMember.id ? 'Saving...' : 'Approve'}</Button>
                <Button type="button" variant="secondary" onClick={() => void handleReject(pendingMember)} disabled={savingId === pendingMember.id}><X size={15} />Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MemberApprovals

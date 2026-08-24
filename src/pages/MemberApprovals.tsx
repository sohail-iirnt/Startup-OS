import { useCallback, useEffect, useState } from 'react'
import { Check, ShieldCheck, UserRound, X } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useWorkspace } from '../context/useWorkspace'
import { approveMember, getPendingMembers, rejectMember } from '../services/memberService'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'

function MemberApprovals() {
  const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [roles, setRoles] = useState<Record<string, UserRole>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const canApprove = hasPermission('members.approve')

  const loadPending = useCallback(async () => {
    if (!workspace?.id || !canApprove) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await getPendingMembers(workspace.id)
      setMembers(result)
      setRoles(
        Object.fromEntries(
          result.map((member) => [
            member.id,
            member.role === 'intern' || member.role === 'member' || member.role === 'viewer'
              ? member.role
              : 'intern',
          ]),
        ),
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pending members.')
    } finally {
      setLoading(false)
    }
  }, [workspace?.id, canApprove])

  useEffect(() => {
    const task = queueMicrotask(() => {
      void loadPending()
    })

    return () => {
      void task
    }
  }, [loadPending])

  async function handleApprove(member: WorkspaceMember) {
    if (!workspace?.id || savingId) return
    setSavingId(member.id)
    setError('')
    try {
      await approveMember(workspace.id, member.userId, roles[member.id] ?? 'intern')
      setMembers((current) => current.filter((item) => item.id !== member.id))
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Unable to approve member.')
    } finally {
      setSavingId('')
    }
  }

  async function handleReject(member: WorkspaceMember) {
    if (!workspace?.id || savingId) return
    setSavingId(member.id)
    setError('')
    try {
      await rejectMember(workspace.id, member.userId)
      setMembers((current) => current.filter((item) => item.id !== member.id))
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Unable to reject member.')
    } finally {
      setSavingId('')
    }
  }

  if (!canApprove) {
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
        <p className="mt-2 max-w-3xl text-sm text-[var(--os-text-secondary)]">Review new registration requests, choose their final role, and grant only the access appropriate for their responsibility.</p>
      </section>

      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      {loading || workspaceLoading ? (
        <Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">Loading member requests...</Card>
      ) : members.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-success-soft)] text-[var(--os-success)]"><Check size={22} /></div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">No pending requests</h2>
          <p className="mt-2 text-sm text-[var(--os-text-secondary)]">New workspace registrations will appear here for approval.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {members.map((member) => (
            <Card key={member.id} className="p-5">
              <div className="flex items-start gap-4">
                {member.photoURL ? <img src={member.photoURL} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserRound size={20} /></div>}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-[var(--os-text)]">{member.displayName || 'Workspace Member'}</h2>
                  <p className="mt-1 truncate text-sm text-[var(--os-text-secondary)]">{member.email || 'No email available'}</p>
                  <p className="mt-1 text-xs text-[var(--os-text-muted)]">Requested: <span className="capitalize">{member.role}</span></p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div><label htmlFor={`role-${member.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">Final role</label><select id={`role-${member.id}`} value={roles[member.id] ?? 'intern'} onChange={(event) => setRoles((current) => ({ ...current, [member.id]: event.target.value as UserRole }))} disabled={savingId === member.id} className="h-10 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"><option value="intern">Intern</option><option value="member">Member</option><option value="viewer">Viewer</option><option value="manager">Manager</option></select></div>
                <Button type="button" onClick={() => void handleApprove(member)} disabled={savingId === member.id}><Check size={15} />{savingId === member.id ? 'Saving...' : 'Approve'}</Button>
                <Button type="button" variant="secondary" onClick={() => void handleReject(member)} disabled={savingId === member.id}><X size={15} />Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MemberApprovals

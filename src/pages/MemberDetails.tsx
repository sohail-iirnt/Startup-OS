import { useEffect, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Mail, Shield, UserRound, UserRoundX } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useWorkspace } from '../context/useWorkspace'
import { useAuth } from '../context/useAuth'
import { getWorkspaceMemberDetails, updateMemberDesignation, updateMemberRole, suspendMember, reactivateMember } from '../services/memberService'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'

const roles: UserRole[] = ['admin', 'manager', 'member', 'intern', 'viewer']

function MemberDetails() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { workspace, hasPermission } = useWorkspace()
  const { user } = useAuth()
  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [designation, setDesignation] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canManage = hasPermission('members.manage')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!workspace?.id || !userId) return
      setLoading(true)
      try {
        const result = await getWorkspaceMemberDetails(workspace.id, userId)
        if (!cancelled) {
          setMember(result)
          setDesignation(result?.designation || '')
          setRole(result?.role || 'member')
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load member.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [workspace?.id, userId])

  async function saveChanges() {
    if (!workspace?.id || !member || !canManage || member.userId === user?.uid) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await updateMemberRole(workspace.id, member.userId, role)
      await updateMemberDesignation(workspace.id, member.userId, designation)
      setMember({ ...member, role, designation })
      setSaved(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save member changes.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleSuspension() {
    if (!workspace?.id || !member || !canManage || member.userId === user?.uid) return
    setSaving(true)
    setError('')
    try {
      if (member.status === 'suspended') {
        await reactivateMember(workspace.id, member.userId)
        setMember({ ...member, status: 'active' })
      } else {
        await suspendMember(workspace.id, member.userId)
        setMember({ ...member, status: 'suspended' })
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update member status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mx-auto w-full max-w-[1100px] p-6 lg:p-8"><Card className="p-10 text-center text-sm text-[var(--os-text-secondary)]">Loading member profile...</Card></div>

  if (!member) return <div className="mx-auto w-full max-w-[1100px] p-6 lg:p-8"><Card className="p-10 text-center"><UserRoundX className="mx-auto text-[var(--os-danger)]" /><h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">Member not found</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">This member may no longer belong to the active workspace.</p><Button className="mt-6" onClick={() => navigate('/team')}>Back to Team</Button></Card></div>

  const isSelf = member.userId === user?.uid
  const initials = (member.displayName || member.email || 'Member').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="mx-auto w-full max-w-[1100px] p-4 sm:p-6 lg:p-8">
      <Link to="/team" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--os-text-secondary)] hover:text-[var(--os-text)]"><ArrowLeft size={16} /> Back to Team</Link>
      <section className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {member.photoURL ? <img src={member.photoURL} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-lg font-bold text-[var(--os-accent)]">{initials}</div>}
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Team member</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">{member.displayName || 'Unnamed member'}</h1><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{member.designation || member.role}</p></div>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${member.status === 'active' ? 'bg-[var(--os-success-soft)] text-[var(--os-success)]' : 'bg-[var(--os-warning-soft)] text-[var(--os-warning)]'}`}><CheckCircle2 size={14} /> {member.status}</span>
      </section>

      {error && <div role="alert" className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
      {saved && <div className="mt-6 rounded-xl border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-4 py-3 text-sm text-[var(--os-success)]">Member profile updated successfully.</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6"><h2 className="text-base font-semibold text-[var(--os-text)]">Member profile</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">Identity and workspace assignment information.</p><div className="mt-6 space-y-3"><div className="flex items-center gap-3 rounded-xl border border-[var(--os-border)] p-4"><Mail size={18} className="text-[var(--os-text-muted)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Email</p><p className="mt-1 text-sm text-[var(--os-text)]">{member.email || 'Not available'}</p></div></div><div className="flex items-center gap-3 rounded-xl border border-[var(--os-border)] p-4"><Shield size={18} className="text-[var(--os-text-muted)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Role</p><p className="mt-1 text-sm capitalize text-[var(--os-text)]">{member.role}</p></div></div><div className="flex items-center gap-3 rounded-xl border border-[var(--os-border)] p-4"><BriefcaseBusiness size={18} className="text-[var(--os-text-muted)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Workspace</p><p className="mt-1 text-sm text-[var(--os-text)]">{workspace?.name}</p></div></div></div></Card>

        <Card className="p-6"><h2 className="text-base font-semibold text-[var(--os-text)]">Access & management</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">Manage this member's operational role.</p>{canManage && !isSelf ? <div className="mt-6 space-y-4"><div><label htmlFor="role" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Role</label><select id="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} disabled={saving} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm capitalize text-[var(--os-text)]">{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div><label htmlFor="designation" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Designation</label><input id="designation" value={designation} onChange={(event) => setDesignation(event.target.value)} disabled={saving} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]" placeholder="e.g. Project Manager" /></div><Button type="button" onClick={() => void saveChanges()} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button><button type="button" onClick={() => void toggleSuspension()} disabled={saving} className="os-focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--os-border)] text-sm font-semibold text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)] hover:text-[var(--os-text)]">{member.status === 'suspended' ? <UserRound size={16} /> : <UserRoundX size={16} />}{member.status === 'suspended' ? 'Reactivate member' : 'Suspend member'}</button></div> : <div className="mt-6 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-sm leading-6 text-[var(--os-text-secondary)]">{isSelf ? 'Your own role cannot be changed from this profile.' : 'You do not have permission to manage this member.'}</div>}</Card>
      </div>
    </div>
  )
}

export default MemberDetails

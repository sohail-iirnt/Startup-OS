import { useEffect, useMemo, useState } from 'react'
import { Check, LockKeyhole, ShieldCheck, UserCheck, UserRound } from 'lucide-react'

import Card from '../components/ui/Card'
import { useWorkspace } from '../context/useWorkspace'
import { getPermissionState, getRolePermissions } from '../types/permissions'
import type { WorkspacePermission } from '../types/permissions'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'
import { subscribeToWorkspaceMembers, updateMemberPermissions } from '../services/workspaceService'

const permissionGroups: Array<{ label: string; permissions: Array<{ key: WorkspacePermission; label: string; description: string }> }> = [
  { label: 'Workspace & people', permissions: [
    { key: 'workspace.view', label: 'View workspace', description: 'Access the workspace command center.' },
    { key: 'members.view', label: 'View members', description: 'See active workspace members.' },
    { key: 'members.approve', label: 'Approve members', description: 'Approve pending registrations and manage invitations.' },
    { key: 'members.manage', label: 'Manage members', description: 'Manage member roles, status, and access details.' },
    { key: 'access.manage', label: 'Manage permissions', description: 'Customize permissions for other workspace members.' },
  ] },
  { label: 'Projects', permissions: [
    { key: 'projects.view', label: 'View projects', description: 'Access project information.' },
    { key: 'projects.create', label: 'Create projects', description: 'Create new projects.' },
    { key: 'projects.update', label: 'Update projects', description: 'Edit project information and progress.' },
    { key: 'projects.delete', label: 'Delete projects', description: 'Remove projects when authorized.' },
  ] },
  { label: 'Tasks', permissions: [
    { key: 'tasks.view', label: 'View tasks', description: 'Access workspace tasks.' },
    { key: 'tasks.create', label: 'Create tasks', description: 'Create and assign tasks.' },
    { key: 'tasks.update', label: 'Update tasks', description: 'Update task status and details.' },
    { key: 'tasks.delete', label: 'Delete tasks', description: 'Delete tasks when authorized.' },
  ] },
  { label: 'Business', permissions: [
    { key: 'clients.view', label: 'View clients', description: 'Access client information.' },
    { key: 'clients.manage', label: 'Manage clients', description: 'Create, edit, and manage client records.' },
    { key: 'websites.view', label: 'View websites & apps', description: 'Access the website portfolio.' },
    { key: 'websites.manage', label: 'Manage websites & apps', description: 'Create, edit, and manage website records.' },
  ] },
  { label: 'Finance & planning', permissions: [
    { key: 'finance.view', label: 'View finance', description: 'Access financial information.' },
    { key: 'finance.manage', label: 'Manage finance', description: 'Manage financial records and operations.' },
    { key: 'calendar.view', label: 'View calendar', description: 'Access business dates and scheduling.' },
    { key: 'calendar.manage', label: 'Manage calendar', description: 'Create, update, and remove calendar events.' },
    { key: 'goals.view', label: 'View goals & targets', description: 'See measurable company and team targets.' },
    { key: 'goals.manage', label: 'Manage goals & targets', description: 'Create goals and update their progress.' },
  ] },
  { label: 'Knowledge & insights', permissions: [
    { key: 'ideas.view', label: 'View ideas', description: 'Access the idea vault.' },
    { key: 'ideas.manage', label: 'Manage ideas', description: 'Create and remove ideas.' },
    { key: 'documents.view', label: 'View documents', description: 'Access company knowledge and documents.' },
    { key: 'documents.manage', label: 'Manage documents', description: 'Create and remove company documents.' },
    { key: 'analytics.view', label: 'View analytics', description: 'Access business insights.' },
  ] },
  { label: 'System', permissions: [
    { key: 'settings.manage', label: 'Manage settings', description: 'Manage workspace-level settings.' },
  ] },
]

function roleLabel(role: UserRole) { return role.charAt(0).toUpperCase() + role.slice(1) }
function samePermissions(left: WorkspacePermission[], right: WorkspacePermission[]) { if (left.length !== right.length) return false; const rightSet = new Set(right); return left.every((permission) => rightSet.has(permission)) }

function AccessControl() {
  const { workspace, member: currentMember, hasPermission } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [granted, setGranted] = useState<WorkspacePermission[]>([])
  const [denied, setDenied] = useState<WorkspacePermission[]>([])
  const [savedGranted, setSavedGranted] = useState<WorkspacePermission[]>([])
  const [savedDenied, setSavedDenied] = useState<WorkspacePermission[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const canManage = hasPermission('access.manage') && Boolean(workspace)

  useEffect(() => {
    if (!canManage || !workspace?.id) return undefined
    let active = true
    let initialised = false
    const applyMembers = (items: WorkspaceMember[]) => {
      if (!active) return
      setMembers(items)
      if (!initialised) {
        const first = items.find((item) => item.userId !== currentMember?.userId) ?? items[0]
        if (first) setSelectedMemberId(first.id)
        initialised = true
      }
      setLoading(false)
    }
    const unsubscribe = subscribeToWorkspaceMembers(workspace.id, applyMembers, (listenerError) => { if (active) { console.error(listenerError); setError('Members could not be loaded.'); setLoading(false) } })
    return () => { active = false; unsubscribe() }
  }, [canManage, currentMember?.userId, workspace?.id])

  const selectedMember = useMemo(() => members.find((item) => item.id === selectedMemberId) ?? null, [members, selectedMemberId])

  useEffect(() => {
    if (!selectedMember) return
    setGranted([...(selectedMember.grantedPermissions ?? [])])
    setDenied([...(selectedMember.deniedPermissions ?? [])])
    setSavedGranted([...(selectedMember.grantedPermissions ?? [])])
    setSavedDenied([...(selectedMember.deniedPermissions ?? [])])
    setMessage(''); setError('')
  }, [selectedMember])

  if (!canManage) return <div className="mx-auto w-full max-w-5xl p-8"><Card className="p-10 text-center"><LockKeyhole className="mx-auto text-[var(--os-text-muted)]" size={32} /><h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">Access restricted</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">Only workspace administrators can customize member permissions.</p></Card></div>

  const selectedPermissions = new Set<WorkspacePermission>([...getRolePermissions(selectedMember?.role ?? 'viewer'), ...granted])
  for (const permission of denied) selectedPermissions.delete(permission)
  const dirty = !samePermissions(granted, savedGranted) || !samePermissions(denied, savedDenied)

  function togglePermission(permission: WorkspacePermission) {
    if (!selectedMember || selectedMember.role === 'owner') return
    setMessage(''); setError('')
    const roleDefault = getRolePermissions(selectedMember.role).includes(permission)
    const isDenied = denied.includes(permission)
    const isGranted = granted.includes(permission)
    if (isDenied) setDenied(denied.filter((item) => item !== permission))
    else if (isGranted) setGranted(granted.filter((item) => item !== permission))
    else if (roleDefault) setDenied([...denied, permission])
    else setGranted([...granted, permission])
  }

  async function savePermissions() {
    if (!workspace?.id || !selectedMember || selectedMember.role === 'owner' || !dirty) return
    setSaving(true); setMessage(''); setError('')
    try {
      await updateMemberPermissions(workspace.id, selectedMember.userId, granted, denied)
      setSavedGranted([...granted]); setSavedDenied([...denied]); setMessage('Permissions saved successfully.')
    } catch (e) { console.error(e); setError(e instanceof Error ? e.message : 'Could not save permissions.') } finally { setSaving(false) }
  }

  function resetPermissions() { if (!selectedMember) return; setGranted([...savedGranted]); setDenied([...savedDenied]); setMessage(''); setError('') }

  return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Security & access</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Roles & Permissions</h1><p className="mt-2 max-w-3xl text-sm text-[var(--os-text-secondary)]">Select any active member and customize exactly what they can see or manage. Role defaults are inherited; custom grants and denials override them.</p></div><Card className="mb-5 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><ShieldCheck size={19} /></div><div><p className="text-sm font-semibold text-[var(--os-text)]">Member access editor</p><p className="text-xs text-[var(--os-text-muted)]">{loading ? 'Loading members…' : `${members.length} active workspace members`}</p></div></div><select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} disabled={loading} className="os-focus-ring h-11 min-w-[280px] rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"><option value="">Select member</option>{members.map((item) => <option key={item.id} value={item.id}>{item.displayName || item.email || item.userId} · {roleLabel(item.role)}</option>)}</select></div></Card>{selectedMember && <><Card className="mb-5 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserRound size={19} /></div><div><h2 className="text-base font-semibold text-[var(--os-text)]">{selectedMember.displayName || 'Unnamed member'}</h2><p className="text-xs text-[var(--os-text-muted)]">{selectedMember.email} · {roleLabel(selectedMember.role)}</p></div></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selectedMember.role === 'owner' ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'bg-[var(--os-success-soft)] text-[var(--os-success)]`}>{selectedMember.role === 'owner' ? 'Owner — locked' : dirty ? 'Unsaved changes' : 'Saved'}</span><button type="button" disabled={!dirty || saving || selectedMember.role === 'owner'} onClick={resetPermissions} className="rounded-xl border border-[var(--os-border)] px-3 py-2 text-xs font-semibold text-[var(--os-text-secondary)] disabled:opacity-50">Reset</button><button type="button" disabled={!dirty || saving || selectedMember.role === 'owner'} onClick={() => void savePermissions()} className="rounded-xl bg-[var(--os-accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save permissions'}</button></div></div>{message && <p className="mt-4 rounded-xl bg-[var(--os-success-soft)] p-3 text-sm text-[var(--os-success)]">{message}</p>}{error && <p className="mt-4 rounded-xl bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]">{error}</p>}</Card><div className="space-y-6">{permissionGroups.map((group) => <Card key={group.label} className="overflow-hidden"><div className="border-b border-[var(--os-border)] px-5 py-4 sm:px-6"><h3 className="text-sm font-semibold text-[var(--os-text)]">{group.label}</h3></div><div className="divide-y divide-[var(--os-border)]">{group.permissions.map((permission) => { const state = getPermissionState({ ...selectedMember, grantedPermissions: granted, deniedPermissions: denied }, permission.key); const effective = selectedPermissions.has(permission.key); const disabled = selectedMember.role === 'owner' || saving; return <button key={permission.key} type="button" disabled={disabled} onClick={() => togglePermission(permission.key)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--os-surface-hover)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-6"><div className="min-w-0"><p className="text-sm font-medium text-[var(--os-text)]">{permission.label}</p><p className="mt-1 text-xs leading-5 text-[var(--os-text-muted)]">{permission.description}</p><p className="mt-1 font-mono text-[10px] text-[var(--os-text-muted)]">{permission.key}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${state === 'inherited' ? 'bg-[var(--os-success-soft)] text-[var(--os-success)]' : state === 'granted' ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : state === 'denied' ? 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]' : 'bg-[var(--os-surface-hover)] text-[var(--os-text-muted)]'}`}>{state}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${effective ? 'border-[var(--os-success)]/30 bg-[var(--os-success-soft)] text-[var(--os-success)]' : 'border-[var(--os-border)] bg-[var(--os-surface-raised)] text-[var(--os-text-muted)]'}`}>{effective ? <Check size={16} /> : <span className="text-xs">—</span>}</span></div></button> })}</div></Card>)}</div></>}{!selectedMember && !loading && <Card className="p-12 text-center"><UserCheck className="mx-auto text-[var(--os-text-muted)]" size={34} /><h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">Choose a member</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">Select a workspace member above to customize their access.</p></Card>}</div>
}

export default AccessControl

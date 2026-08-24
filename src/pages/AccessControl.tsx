import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, LockKeyhole, ShieldCheck, UserCheck, UserRound } from 'lucide-react'

import Card from '../components/ui/Card'
import { useWorkspace } from '../context/useWorkspace'
import { getPermissionState, getRolePermissions } from '../types/permissions'
import type { WorkspacePermission } from '../types/permissions'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'
import { getWorkspaceMembers, subscribeToWorkspaceMembers, updateMemberPermissions } from '../services/workspaceService'

const permissionGroups: Array<{ label: string; permissions: Array<{ key: WorkspacePermission; label: string; description: string }> }> = [
  { label: 'Workspace & people', permissions: [
    { key: 'workspace.view', label: 'View workspace', description: 'Access the workspace command center.' },
    { key: 'members.view', label: 'View members', description: 'See active workspace members.' },
    { key: 'members.approve', label: 'Approve members', description: 'Approve pending registrations and manage invitations.' },
    { key: 'members.manage', label: 'Manage members', description: 'Manage member roles, status, and access details.' },
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
  ] },
  { label: 'Knowledge & insights', permissions: [
    { key: 'ideas.view', label: 'View ideas', description: 'Access the idea vault.' },
    { key: 'documents.view', label: 'View documents', description: 'Access company knowledge and documents.' },
    { key: 'analytics.view', label: 'View analytics', description: 'Access business insights.' },
  ] },
  { label: 'System', permissions: [
    { key: 'settings.manage', label: 'Manage settings', description: 'Manage workspace-level settings.' },
  ] },
]

const ALL_PERMISSIONS = permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.key))

function roleLabel(role: UserRole) { return role.charAt(0).toUpperCase() + role.slice(1) }

function AccessControl() {
  const { workspace, member: currentMember, hasPermission } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [granted, setGranted] = useState<WorkspacePermission[]>([])
  const [denied, setDenied] = useState<WorkspacePermission[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const canManage = hasPermission('members.manage') && Boolean(workspace)

  useEffect(() => {
    if (!canManage || !workspace?.id) return undefined
    let active = true

    getWorkspaceMembers(workspace.id).then((items) => {
      if (!active) return
      setMembers(items)
      if (!selectedMemberId) {
        const first = items.find((item) => item.userId !== currentMember?.userId) ?? items[0]
        if (first) {
          setSelectedMemberId(first.userId)
          setGranted(first.grantedPermissions ?? [])
          setDenied(first.deniedPermissions ?? [])
        }
      }
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load workspace members.')
    }).finally(() => { if (active) setLoading(false) })

    const unsubscribe = subscribeToWorkspaceMembers(workspace.id, (items) => {
      if (!active) return
      setMembers(items)
      if (!selectedMemberId) {
        const first = items.find((item) => item.userId !== currentMember?.userId) ?? items[0]
        if (first) {
          setSelectedMemberId(first.userId)
          setGranted(first.grantedPermissions ?? [])
          setDenied(first.deniedPermissions ?? [])
        }
      }
    }, (listenError) => {
      if (active) setError(listenError.message)
    })

    return () => { active = false; unsubscribe() }
  }, [canManage, workspace?.id, currentMember?.userId, selectedMemberId])

  const selectedMember = useMemo(() => members.find((item) => item.userId === selectedMemberId) ?? null, [members, selectedMemberId])
  const selectedPermissions = useMemo(() => new Set([...getRolePermissions(selectedMember?.role ?? 'viewer'), ...granted].filter((permission) => !denied.includes(permission))), [selectedMember?.role, granted, denied])
  const totalPermissions = ALL_PERMISSIONS.length

  function selectMember(userId: string) {
    const next = members.find((item) => item.userId === userId)
    setSelectedMemberId(userId)
    setGranted(next?.grantedPermissions ?? [])
    setDenied(next?.deniedPermissions ?? [])
    setMessage('')
    setError('')
  }

  function togglePermission(permission: WorkspacePermission) {
    if (!selectedMember || selectedMember.role === 'owner') return
    const state = getPermissionState({ ...selectedMember, grantedPermissions: granted, deniedPermissions: denied }, permission)
    setMessage('')
    if (state === 'inherited') {
      setDenied((current) => current.includes(permission) ? current : [...current, permission])
      setGranted((current) => current.filter((item) => item !== permission))
    } else if (state === 'denied') {
      setDenied((current) => current.filter((item) => item !== permission))
    } else if (state === 'granted') {
      setGranted((current) => current.filter((item) => item !== permission))
    } else {
      setGranted((current) => current.includes(permission) ? current : [...current, permission])
      setDenied((current) => current.filter((item) => item !== permission))
    }
  }

  function resetToRoleDefaults() {
    if (!selectedMember || selectedMember.role === 'owner') return
    setGranted([])
    setDenied([])
    setMessage('Custom overrides cleared. Save to restore this member to the role defaults.')
    setError('')
  }

  function grantAllPermissions() {
    if (!selectedMember || selectedMember.role === 'owner') return
    const rolePermissions = new Set(getRolePermissions(selectedMember.role))
    setGranted(ALL_PERMISSIONS.filter((permission) => !rolePermissions.has(permission)))
    setDenied([])
    setMessage('All available permissions selected. Save to apply.')
    setError('')
  }

  function denyAllOptionalPermissions() {
    if (!selectedMember || selectedMember.role === 'owner') return
    const rolePermissions = getRolePermissions(selectedMember.role)
    setGranted([])
    setDenied([...rolePermissions])
    setMessage('Role permissions selected for explicit denial. Save to apply.')
    setError('')
  }

  async function savePermissions() {
    if (!workspace?.id || !selectedMember || selectedMember.role === 'owner') return
    setSaving(true); setError(''); setMessage('')
    try {
      await updateMemberPermissions(workspace.id, selectedMember.userId, granted, denied)
      setMembers((current) => current.map((item) => item.userId === selectedMember.userId ? { ...item, grantedPermissions: granted, deniedPermissions: denied } : item))
      setMessage(`Permissions saved for ${selectedMember.displayName || selectedMember.email || 'this member'}.`)
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save permissions.')
    } finally { setSaving(false) }
  }

  if (!canManage) {
    return <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-8"><Card className="p-8 text-center"><LockKeyhole className="mx-auto text-[var(--os-warning)]" size={28} /><h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">Permission management restricted</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">Only authorized workspace administrators can customize member permissions.</p></Card></div>
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section className="mb-8"><p className="mb-2 text-sm font-medium text-[var(--os-accent)]">System / Access control</p><h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Roles & permissions</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--os-text-secondary)]">Role defaults are only the starting point. Owners and authorized admins can customize access for each active member with explicit grants or denials.</p></section>
      <Card className="mb-6 p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserCheck size={20} /></div><div><h2 className="text-base font-semibold text-[var(--os-text)]">Customize a member</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">Choose an active member, then tick or revoke individual capabilities.</p></div></div><div className="relative w-full lg:max-w-md"><UserRound size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><select value={selectedMemberId} onChange={(event) => selectMember(event.target.value)} disabled={loading} className="os-focus-ring h-11 w-full appearance-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-10 pr-10 text-sm text-[var(--os-text)]">{members.map((item) => <option key={item.userId} value={item.userId}>{item.displayName || item.email || 'Unnamed member'} — {roleLabel(item.role)}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /></div></div></Card>
      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
      {message && <div role="status" className="mb-5 rounded-xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--os-success)]">{message}</div>}
      {selectedMember && <>
        <Card className="mb-6 p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><ShieldCheck size={21} className="text-[var(--os-accent)]" /><div><h2 className="text-lg font-semibold text-[var(--os-text)]">{selectedMember.displayName || selectedMember.email || 'Unnamed member'}</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{selectedMember.email || 'No email'} · {roleLabel(selectedMember.role)}</p></div></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-1.5 text-[var(--os-text-secondary)]">{selectedPermissions.size} / {totalPermissions} effective</span><span className="rounded-full border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-1.5 text-[var(--os-text-secondary)]">{granted.length} custom grants</span><span className="rounded-full border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-1.5 text-[var(--os-text-secondary)]">{denied.length} custom denials</span></div></div></Card>
        {selectedMember.role === 'owner' && <div className="mb-6 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text-secondary)]">The workspace owner has full control and cannot be restricted from this screen.</div>}
        {selectedMember.role !== 'owner' && <Card className="mb-5 p-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={grantAllPermissions} className="os-focus-ring rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--os-text)]">Grant all</button><button type="button" onClick={denyAllOptionalPermissions} className="os-focus-ring rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--os-text)]">Remove role access</button><button type="button" onClick={resetToRoleDefaults} className="os-focus-ring rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--os-text)]">Reset to role defaults</button><span className="self-center text-xs text-[var(--os-text-muted)]">Use individual permissions below for precise custom access.</span></div></Card>}
        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-[var(--os-text-secondary)]"><span className="rounded-full bg-[var(--os-success-soft)] px-3 py-1.5 text-[var(--os-success)]">Inherited = role default</span><span className="rounded-full bg-[var(--os-accent-soft)] px-3 py-1.5 text-[var(--os-accent)]">Granted = custom access</span><span className="rounded-full bg-[var(--os-danger-soft)] px-3 py-1.5 text-[var(--os-danger)]">Denied = explicitly blocked</span></div>
        <div className="space-y-6">{permissionGroups.map((group) => <Card key={group.label} className="overflow-hidden"><div className="border-b border-[var(--os-border)] px-5 py-4 sm:px-6"><h3 className="text-sm font-semibold text-[var(--os-text)]">{group.label}</h3></div><div className="divide-y divide-[var(--os-border)]">{group.permissions.map((permission) => { const state = getPermissionState({ ...selectedMember, grantedPermissions: granted, deniedPermissions: denied }, permission); const effective = selectedPermissions.has(permission.key); const disabled = selectedMember.role === 'owner'; return <button key={permission.key} type="button" disabled={disabled} onClick={() => togglePermission(permission.key)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--os-surface-hover)] disabled:cursor-not-allowed sm:px-6"><div className="min-w-0"><p className="text-sm font-medium text-[var(--os-text)]">{permission.label}</p><p className="mt-1 text-xs leading-5 text-[var(--os-text-muted)]">{permission.description}</p><p className="mt-1 font-mono text-[10px] text-[var(--os-text-muted)]">{permission.key}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${state === 'inherited' ? 'bg-[var(--os-success-soft)] text-[var(--os-success)]' : state === 'granted' ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : state === 'denied' ? 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]' : 'bg-[var(--os-surface-hover)] text-[var(--os-text-muted)]'}`}>{state}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${effective ? 'border-[var(--os-success)]/30 bg-[var(--os-success-soft)] text-[var(--os-success)]' : 'border-[var(--os-border)] bg-[var(--os-surface-raised)] text-[var(--os-text-muted)]'}`}>{effective ? <Check size={16} /> : <span className="text-xs">—</span>}</span></div></button> })}</div></Card>)}</div>
        <div className="sticky bottom-4 z-10 mt-6 flex justify-end"><button type="button" onClick={() => void savePermissions()} disabled={saving || selectedMember.role === 'owner'} className="os-focus-ring inline-flex h-11 items-center justify-center rounded-xl bg-[var(--os-accent)] px-5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving permissions…' : 'Save permission changes'}</button></div>
      </>}
    </div>
  )
}

export default AccessControl

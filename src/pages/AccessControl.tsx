import { useMemo, useState } from 'react'
import { Check, LockKeyhole, ShieldCheck, UserCheck } from 'lucide-react'

import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { getRolePermissions } from '../types/permissions'
import type { WorkspacePermission } from '../types/permissions'
import type { UserRole } from '../types/common'

const roles: UserRole[] = ['owner', 'admin', 'manager', 'member', 'intern', 'viewer']

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

function roleLabel(role: UserRole) { return role.charAt(0).toUpperCase() + role.slice(1) }

function AccessControl() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner')
  const selectedPermissions = useMemo(() => new Set(getRolePermissions(selectedRole)), [selectedRole])
  const permissionCount = selectedPermissions.size
  const totalPermissions = permissionGroups.reduce((count, group) => count + group.permissions.length, 0)

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-medium text-[var(--os-accent)]">System / Access control</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Roles & permissions</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--os-text-secondary)] sm:text-base">Every active member receives the permissions of their approved role. This screen is the role matrix used by Startup OS to decide what each account can see and do.</p>
      </section>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserCheck size={20} /></div>
          <div>
            <h2 className="text-base font-semibold text-[var(--os-text)]">How role access is assigned</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--os-text-secondary)]">When an owner/admin approves a registration, the selected final role is written to that member's workspace membership. On the next load/login, the account receives that role's effective permissions automatically. Changing the member's role changes the available areas and actions without changing their Firebase login.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit p-5">
          <SectionHeader title="Roles" description="Current workspace access profiles." />
          <div className="mt-5 space-y-2">
            {roles.map((role) => {
              const active = role === selectedRole
              const count = getRolePermissions(role).length
              return <button key={role} type="button" onClick={() => setSelectedRole(role)} className={`os-focus-ring flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${active ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)]' : 'border-[var(--os-border)] hover:bg-[var(--os-surface-hover)]'}`}><span><span className="block text-sm font-semibold text-[var(--os-text)]">{roleLabel(role)}</span><span className="mt-0.5 block text-xs text-[var(--os-text-muted)]">{count} permissions</span></span>{active && <Check size={17} className="text-[var(--os-accent)]" />}</button>
            })}
          </div>
          <div className="mt-5 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className="flex items-start gap-3"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-[var(--os-text-muted)]" /><p className="text-xs leading-5 text-[var(--os-text-secondary)]">Access is enforced through workspace membership, navigation visibility, protected routes, page actions, and Firestore security rules.</p></div></div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><ShieldCheck size={20} /></div><div><h2 className="text-lg font-semibold text-[var(--os-text)]">{roleLabel(selectedRole)} access profile</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{permissionCount} of {totalPermissions} currently available permissions</p></div></div><span className="inline-flex w-fit rounded-full border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-1.5 text-xs font-medium capitalize text-[var(--os-text-secondary)]">{selectedRole}</span></div>
          </Card>

          {permissionGroups.map((group) => <Card key={group.label} className="overflow-hidden"><div className="border-b border-[var(--os-border)] px-5 py-4 sm:px-6"><h3 className="text-sm font-semibold text-[var(--os-text)]">{group.label}</h3></div><div className="divide-y divide-[var(--os-border)]">{group.permissions.map((permission) => { const enabled = selectedPermissions.has(permission.key); return <div key={permission.key} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="text-sm font-medium text-[var(--os-text)]">{permission.label}</p><p className="mt-1 text-xs leading-5 text-[var(--os-text-muted)]">{permission.description}</p><p className="mt-1 font-mono text-[10px] text-[var(--os-text-muted)]">{permission.key}</p></div><div aria-label={enabled ? 'Permission enabled' : 'Permission disabled'} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${enabled ? 'border-[var(--os-success)]/30 bg-[var(--os-success)]/10 text-[var(--os-success)]' : 'border-[var(--os-border)] bg-[var(--os-surface-raised)] text-[var(--os-text-muted)]'}`}>{enabled ? <Check size={15} /> : <span className="text-xs">—</span>}</div></div> })}</div></Card>)}
        </div>
      </div>
    </div>
  )
}

export default AccessControl

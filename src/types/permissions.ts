import type { UserRole } from './common'
import type { WorkspaceMember } from './workspace'

export type WorkspacePermission =
  | 'workspace.view' | 'members.view' | 'members.approve' | 'members.manage'
  | 'projects.view' | 'projects.create' | 'projects.update' | 'projects.delete'
  | 'tasks.view' | 'tasks.create' | 'tasks.update' | 'tasks.delete'
  | 'clients.view' | 'clients.manage' | 'websites.view' | 'websites.manage'
  | 'finance.view' | 'finance.manage' | 'calendar.view' | 'calendar.manage'
  | 'ideas.view' | 'documents.view' | 'analytics.view' | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, readonly WorkspacePermission[]> = {
  owner: ['workspace.view','members.view','members.approve','members.manage','projects.view','projects.create','projects.update','projects.delete','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','finance.view','finance.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view','settings.manage'],
  admin: ['workspace.view','members.view','members.approve','members.manage','projects.view','projects.create','projects.update','projects.delete','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','finance.view','finance.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view','settings.manage'],
  manager: ['workspace.view','members.view','members.approve','projects.view','projects.create','projects.update','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view'],
  member: ['workspace.view','members.view','projects.view','projects.update','tasks.view','tasks.create','tasks.update','clients.view','websites.view','calendar.view','ideas.view','documents.view','analytics.view'],
  intern: ['workspace.view','members.view','projects.view','projects.create','projects.update','tasks.view','tasks.update','calendar.view','ideas.view','documents.view'],
  viewer: ['workspace.view','members.view','projects.view','tasks.view','clients.view','websites.view','calendar.view','ideas.view','documents.view','analytics.view'],
}

// These capabilities can change the workspace itself or other members' access.
// They are intentionally role-controlled and cannot be delegated through custom grants.
const ROLE_ONLY_PERMISSIONS = new Set<WorkspacePermission>(['members.manage', 'settings.manage'])

export function roleHasPermission(role: UserRole, permission: WorkspacePermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function getRolePermissions(role: UserRole): readonly WorkspacePermission[] {
  return ROLE_PERMISSIONS[role]
}

export function getEffectivePermissions(member: WorkspaceMember | null): readonly WorkspacePermission[] {
  if (!member || member.status !== 'active') return []
  const effective = new Set<WorkspacePermission>(ROLE_PERMISSIONS[member.role])
  for (const permission of member.grantedPermissions ?? []) {
    if (!ROLE_ONLY_PERMISSIONS.has(permission)) effective.add(permission)
  }
  for (const permission of member.deniedPermissions ?? []) {
    if (!ROLE_ONLY_PERMISSIONS.has(permission)) effective.delete(permission)
  }
  return Array.from(effective)
}

export function memberHasPermission(member: WorkspaceMember | null, permission: WorkspacePermission): boolean {
  if (!member || member.status !== 'active') return false
  if (ROLE_ONLY_PERMISSIONS.has(permission) && !['owner', 'admin'].includes(member.role)) return false
  return getEffectivePermissions(member).includes(permission)
}

export function getPermissionState(member: WorkspaceMember | null, permission: WorkspacePermission): 'inherited' | 'granted' | 'denied' | 'unavailable' {
  if (!member || member.status !== 'active') return 'unavailable'
  if (ROLE_ONLY_PERMISSIONS.has(permission) && !['owner', 'admin'].includes(member.role)) return 'unavailable'
  if ((member.deniedPermissions ?? []).includes(permission)) return 'denied'
  if ((member.grantedPermissions ?? []).includes(permission)) return 'granted'
  return roleHasPermission(member.role, permission) ? 'inherited' : 'unavailable'
}

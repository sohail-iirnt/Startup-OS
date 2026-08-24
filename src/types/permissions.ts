import type { UserRole } from './common'
import type { WorkspaceMember } from './workspace'

export type WorkspacePermission =
  | 'workspace.view' | 'members.view' | 'members.approve' | 'members.manage' | 'access.manage'
  | 'projects.view' | 'projects.create' | 'projects.update' | 'projects.delete'
  | 'tasks.view' | 'tasks.create' | 'tasks.update' | 'tasks.delete'
  | 'clients.view' | 'clients.manage' | 'websites.view' | 'websites.manage'
  | 'finance.view' | 'finance.manage' | 'calendar.view' | 'calendar.manage'
  | 'ideas.view' | 'documents.view' | 'analytics.view' | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, readonly WorkspacePermission[]> = {
  owner: ['workspace.view','members.view','members.approve','members.manage','access.manage','projects.view','projects.create','projects.update','projects.delete','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','finance.view','finance.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view','settings.manage'],
  admin: ['workspace.view','members.view','members.approve','members.manage','access.manage','projects.view','projects.create','projects.update','projects.delete','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','finance.view','finance.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view','settings.manage'],
  manager: ['workspace.view','members.view','members.approve','projects.view','projects.create','projects.update','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view'],
  member: ['workspace.view','members.view','projects.view','projects.update','tasks.view','tasks.create','tasks.update','clients.view','websites.view','calendar.view','ideas.view','documents.view','analytics.view'],
  intern: ['workspace.view','members.view','projects.view','projects.create','projects.update','tasks.view','tasks.update','calendar.view','ideas.view','documents.view'],
  viewer: ['workspace.view','members.view','projects.view','tasks.view','clients.view','websites.view','calendar.view','ideas.view','documents.view','analytics.view'],
}

const ROLE_ONLY_PERMISSIONS = new Set<WorkspacePermission>(['members.manage', 'access.manage', 'settings.manage'])
const FULL_ACCESS_ROLES = new Set<UserRole>(['owner', 'admin'])

/** Normalize legacy/title-case runtime role values before permission lookup. */
export function normalizeUserRole(role: unknown): UserRole {
  const normalized = String(role ?? '').trim().toLowerCase()
  if (normalized === 'owner') return 'owner'
  if (normalized === 'admin' || normalized === 'administrator') return 'admin'
  if (normalized === 'manager') return 'manager'
  if (normalized === 'member') return 'member'
  if (normalized === 'intern') return 'intern'
  if (normalized === 'viewer') return 'viewer'
  return 'viewer'
}

export function roleHasPermission(role: UserRole, permission: WorkspacePermission): boolean {
  return ROLE_PERMISSIONS[normalizeUserRole(role)].includes(permission)
}

export function getRolePermissions(role: UserRole): readonly WorkspacePermission[] {
  return ROLE_PERMISSIONS[normalizeUserRole(role)]
}

export function getEffectivePermissions(member: WorkspaceMember | null): readonly WorkspacePermission[] {
  if (!member || member.status !== 'active') return []

  const role = normalizeUserRole(member.role)
  // Owner/admin are workspace administrators. Custom denials can never
  // accidentally remove their administrator baseline.
  if (FULL_ACCESS_ROLES.has(role)) return ROLE_PERMISSIONS[role]

  const effective = new Set<WorkspacePermission>(ROLE_PERMISSIONS[role])
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

  const role = normalizeUserRole(member.role)
  if (FULL_ACCESS_ROLES.has(role)) return roleHasPermission(role, permission)
  if (ROLE_ONLY_PERMISSIONS.has(permission)) return false
  return getEffectivePermissions(member).includes(permission)
}

export function getPermissionState(member: WorkspaceMember | null, permission: WorkspacePermission): 'inherited' | 'granted' | 'denied' | 'unavailable' {
  if (!member || member.status !== 'active') return 'unavailable'

  const role = normalizeUserRole(member.role)
  if (FULL_ACCESS_ROLES.has(role)) return 'inherited'
  if (ROLE_ONLY_PERMISSIONS.has(permission)) return 'unavailable'
  if ((member.deniedPermissions ?? []).includes(permission)) return 'denied'
  if ((member.grantedPermissions ?? []).includes(permission)) return 'granted'
  return roleHasPermission(role, permission) ? 'inherited' : 'unavailable'
}

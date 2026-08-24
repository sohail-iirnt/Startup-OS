import type { UserRole } from './common'
import type { WorkspaceMember } from './workspace'

export type WorkspacePermission =
  | 'workspace.view' | 'members.view' | 'members.approve' | 'members.manage' | 'access.manage'
  | 'projects.view' | 'projects.create' | 'projects.update' | 'projects.delete'
  | 'tasks.view' | 'tasks.create' | 'tasks.update' | 'tasks.delete'
  | 'clients.view' | 'clients.manage' | 'websites.view' | 'websites.manage'
  | 'finance.view' | 'finance.manage' | 'calendar.view' | 'calendar.manage'
  | 'ideas.view' | 'ideas.manage' | 'documents.view' | 'documents.manage' | 'goals.view' | 'goals.manage' | 'analytics.view' | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, readonly WorkspacePermission[]> = {
  owner: ['workspace.view','members.view','members.approve','members.manage','access.manage','projects.view','projects.create','projects.update','projects.delete','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','finance.view','finance.manage','calendar.view','calendar.manage','ideas.view','ideas.manage','documents.view','documents.manage','goals.view','goals.manage','analytics.view','settings.manage'],
  admin: ['workspace.view','members.view','members.approve','members.manage','access.manage','projects.view','projects.create','projects.update','projects.delete','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','finance.view','finance.manage','calendar.view','calendar.manage','ideas.view','ideas.manage','documents.view','documents.manage','goals.view','goals.manage','analytics.view','settings.manage'],
  manager: ['workspace.view','members.view','members.approve','projects.view','projects.create','projects.update','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','calendar.view','calendar.manage','ideas.view','ideas.manage','documents.view','documents.manage','goals.view','goals.manage','analytics.view'],
  member: ['workspace.view','members.view','projects.view','projects.update','tasks.view','tasks.create','tasks.update','clients.view','websites.view','calendar.view','ideas.view','ideas.manage','documents.view','documents.manage','goals.view','analytics.view'],
  intern: ['workspace.view','members.view','projects.view','projects.create','projects.update','tasks.view','tasks.update','calendar.view','ideas.view','ideas.manage','documents.view','goals.view'],
  viewer: ['workspace.view','members.view','projects.view','tasks.view','clients.view','websites.view','calendar.view','ideas.view','documents.view','goals.view','analytics.view'],
}

const ROLE_ONLY_PERMISSIONS = new Set<WorkspacePermission>(['members.manage', 'access.manage', 'settings.manage'])
const FULL_ACCESS_ROLES = new Set<UserRole>(['owner', 'admin'])

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
  const normalizedRole = normalizeUserRole(role)
  if (FULL_ACCESS_ROLES.has(normalizedRole)) return true
  return ROLE_PERMISSIONS[normalizedRole].includes(permission)
}

export function getRolePermissions(role: UserRole): readonly WorkspacePermission[] {
  return ROLE_PERMISSIONS[normalizeUserRole(role)]
}

export function getEffectivePermissions(member: WorkspaceMember | null): readonly WorkspacePermission[] {
  if (!member || member.status !== 'active') return []
  const role = normalizeUserRole(member.role)
  if (FULL_ACCESS_ROLES.has(role)) return ROLE_PERMISSIONS[role]
  const effective = new Set<WorkspacePermission>(ROLE_PERMISSIONS[role])
  for (const permission of member.grantedPermissions ?? []) effective.add(permission)
  for (const permission of member.deniedPermissions ?? []) effective.delete(permission)
  return Array.from(effective)
}

export function memberHasPermission(member: WorkspaceMember | null, permission: WorkspacePermission): boolean {
  if (!member || member.status !== 'active') return false
  const role = normalizeUserRole(member.role)
  if (FULL_ACCESS_ROLES.has(role)) return true
  return getEffectivePermissions(member).includes(permission)
}

export function getPermissionState(member: WorkspaceMember | null, permission: WorkspacePermission): 'inherited' | 'granted' | 'denied' | 'unavailable' {
  if (!member || member.status !== 'active') return 'unavailable'
  const role = normalizeUserRole(member.role)
  if (FULL_ACCESS_ROLES.has(role)) return 'inherited'
  if ((member.deniedPermissions ?? []).includes(permission)) return 'denied'
  if ((member.grantedPermissions ?? []).includes(permission)) return 'granted'
  return roleHasPermission(role, permission) ? 'inherited' : 'unavailable'
}

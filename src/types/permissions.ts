import type { UserRole } from './common'

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
  manager: ['workspace.view','members.view','members.approve','members.manage','projects.view','projects.create','projects.update','tasks.view','tasks.create','tasks.update','tasks.delete','clients.view','clients.manage','websites.view','websites.manage','calendar.view','calendar.manage','ideas.view','documents.view','analytics.view'],
  member: ['workspace.view','members.view','projects.view','projects.update','tasks.view','tasks.create','tasks.update','clients.view','websites.view','calendar.view','ideas.view','documents.view','analytics.view'],
  intern: ['workspace.view','members.view','projects.view','projects.create','projects.update','tasks.view','tasks.update','calendar.view','ideas.view','documents.view'],
  viewer: ['workspace.view','members.view','projects.view','tasks.view','clients.view','websites.view','calendar.view','ideas.view','documents.view','analytics.view'],
}

export function roleHasPermission(role: UserRole, permission: WorkspacePermission): boolean { return ROLE_PERMISSIONS[role].includes(permission) }
export function getRolePermissions(role: UserRole): readonly WorkspacePermission[] { return ROLE_PERMISSIONS[role] }

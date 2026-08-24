import type {
  BaseEntity,
  ID,
  MembershipStatus,
  UserRole,
} from './common'
import type { WorkspacePermission } from './permissions'

export type Workspace = {
  id: ID
  name: string
  description?: string
  ownerId: ID
  workspaceCode?: string
} & Omit<BaseEntity, 'workspaceId' | 'createdBy'>

export type WorkspaceMember = {
  id: ID
  workspaceId: ID
  userId: ID
  role: UserRole
  status: MembershipStatus
  displayName?: string
  email?: string
  photoURL?: string | null
  designation?: string
  /** Explicit permissions granted to this member in addition to their role defaults. */
  grantedPermissions?: WorkspacePermission[]
  /** Explicit permissions removed from this member even when their role normally grants them. */
  deniedPermissions?: WorkspacePermission[]
  joinedAt: Date
  updatedAt: Date
}

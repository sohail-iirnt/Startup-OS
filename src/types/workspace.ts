import type {
  BaseEntity,
  ID,
  MembershipStatus,
  UserRole,
} from './common'

export type Workspace = {
  id: ID
  name: string
  description?: string
  ownerId: ID
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
  joinedAt: Date
  updatedAt: Date
}

import type {
  ID,
  TimestampFields,
  UserRole,
  MembershipStatus,
} from './common'

export type UserProfile = {
  id: ID
  displayName: string
  email: string
  photoURL?: string | null
  defaultWorkspaceId?: ID | null
} & TimestampFields

export type WorkspaceMembership = {
  id: ID
  workspaceId: ID
  userId: ID
  role: UserRole
  status: MembershipStatus
  joinedAt: Date
  updatedAt: Date
}

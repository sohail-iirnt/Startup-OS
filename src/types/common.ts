export type ID = string

export type UserRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'member'
  | 'intern'
  | 'viewer'

export type MembershipStatus =
  | 'pending'
  | 'active'
  | 'invited'
  | 'suspended'
  | 'rejected'

export type EntityStatus =
  | 'active'
  | 'archived'

export type TimestampFields = {
  createdAt: Date
  updatedAt: Date
}

export type WorkspaceOwned = {
  workspaceId: ID
}

export type CreatedBy = {
  createdBy: ID
}

export type BaseEntity =
  & {
      id: ID
    }
  & TimestampFields
  & WorkspaceOwned
  & CreatedBy
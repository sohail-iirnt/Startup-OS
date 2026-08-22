import type {
  ID,
  TimestampFields,
} from './common'

export type ActivityLog = {
  id: ID

  workspaceId: ID
  actorId: ID

  action: string

  entityType: string
  entityId: ID

  metadata?: Record<string, unknown>

  createdAt: Date
} & Partial<Pick<TimestampFields, 'updatedAt'>>
import type {
  BaseEntity,
  ID,
} from './common'

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export type ProjectPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type Project = BaseEntity & {
  clientId?: ID | null

  name: string
  description?: string

  status: ProjectStatus
  priority: ProjectPriority

  startDate?: Date | null
  dueDate?: Date | null

  budget?: number | null
  currency: string

  progress: number

  deletedAt?: Date | null
}
import type {
  BaseEntity,
  ID,
} from './common'

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled'

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type Task = BaseEntity & {
  projectId?: ID | null
  clientId?: ID | null
  assigneeId?: ID | null

  title: string
  description?: string

  status: TaskStatus
  priority: TaskPriority

  dueDate?: Date | null
  completedAt?: Date | null

  deletedAt?: Date | null
}
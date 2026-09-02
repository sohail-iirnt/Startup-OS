import type { BaseEntity, ID } from './common'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskChecklistItem = { id: string; text: string; completed: boolean }

export type Task = BaseEntity & {
  projectId?: ID | null
  clientId?: ID | null
  assigneeId?: ID | null
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date | null
  startDate?: Date | null
  completedAt?: Date | null
  deletedAt?: Date | null
  checklist?: TaskChecklistItem[]
  tags?: string[]
  estimatedMinutes?: number
  actualMinutes?: number
  blockedReason?: string
  notes?: string
}

export type CreateTaskInput = {
  title: string
  projectId?: ID | null
  clientId?: ID | null
  assigneeId?: ID | null
  status: TaskStatus
  priority: TaskPriority
  description: string
  dueDate?: Date | null
  startDate?: Date | null
  checklist?: TaskChecklistItem[]
  tags?: string[]
  estimatedMinutes?: number
  actualMinutes?: number
  blockedReason?: string
  notes?: string
}
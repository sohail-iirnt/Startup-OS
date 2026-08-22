import type {
  BaseEntity,
} from './common'

export type IdeaStatus =
  | 'captured'
  | 'evaluating'
  | 'planned'
  | 'in_progress'
  | 'implemented'
  | 'discarded'

export type IdeaPriority =
  | 'low'
  | 'medium'
  | 'high'

export type Idea = BaseEntity & {
  title: string
  description?: string

  status: IdeaStatus
  priority: IdeaPriority

  tags: string[]

  deletedAt?: Date | null
}
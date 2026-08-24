import type { BaseEntity } from './common'

export type ProjectType = 'website' | 'web-app' | 'mobile-app' | 'branding' | 'software' | 'other'
export type ProjectStatus = 'planning' | 'in-development' | 'on-hold' | 'testing' | 'completed' | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Project = BaseEntity & {
  name: string
  clientId: string
  clientName: string
  ownerId: string
  ownerName: string
  memberIds: string[]
  type: ProjectType
  status: ProjectStatus
  priority: ProjectPriority
  startDate: Date | null
  deadline: Date | null
  description: string
  budget: number
  projectValue: number
  notes: string
}

export type CreateProjectInput = {
  name: string
  clientId: string
  clientName: string
  ownerId: string
  ownerName: string
  memberIds: string[]
  type: ProjectType
  status: ProjectStatus
  priority: ProjectPriority
  startDate: string
  deadline: string
  description: string
  budget: number
  projectValue: number
  notes: string
}

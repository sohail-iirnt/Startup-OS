import type { BaseEntity } from './common'

export type ClientType = 'individual' | 'company'
export type ClientStatus = 'lead' | 'active' | 'inactive' | 'archived'
export type CrmStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export type Client = BaseEntity & {
  type: ClientType
  name: string
  companyName?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  status: ClientStatus
  source?: string
  notes?: string
  crmStage?: CrmStage
  dealValue?: number
  probability?: number
  expectedCloseDate?: string
  nextFollowUp?: string
  lastContactDate?: string
  relationshipOwnerId?: string
  tags?: string[]
  deletedAt?: Date | null
}

export type CreateClientInput = {
  type: ClientType
  name: string
  companyName: string
  email: string
  phone: string
  website: string
  address: string
  status: ClientStatus
  source: string
  notes: string
  crmStage?: CrmStage
  dealValue?: number
  probability?: number
  expectedCloseDate?: string
  nextFollowUp?: string
  lastContactDate?: string
  relationshipOwnerId?: string
  tags?: string[]
}
import type { BaseEntity } from './common'

export type ClientType =
  | 'individual'
  | 'company'

export type ClientStatus =
  | 'lead'
  | 'active'
  | 'inactive'
  | 'archived'

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
}

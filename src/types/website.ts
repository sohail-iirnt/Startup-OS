import type {
  BaseEntity,
  ID,
} from './common'

export type WebsiteType =
  | 'website'
  | 'web-app'
  | 'mobile-app'
  | 'other'

export type WebsiteStatus =
  | 'live'
  | 'in-development'
  | 'maintenance'
  | 'testing'
  | 'paused'
  | 'expired'

export type Website = {
  id: ID
  name: string
  clientName: string
  type: WebsiteType
  status: WebsiteStatus
  liveUrl: string
  hostingProvider: string
  developmentAmount: number
  maintenanceOpted: boolean
  monthlyMaintenanceCharge: number
  notes: string
} & Omit<
  BaseEntity,
  'createdBy'
>

export type CreateWebsiteInput = {
  name: string
  clientName: string
  type: WebsiteType
  status: WebsiteStatus
  liveUrl: string
  hostingProvider: string
  developmentAmount: number
  maintenanceOpted: boolean
  monthlyMaintenanceCharge: number
  notes: string
}
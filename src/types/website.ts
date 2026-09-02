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

export type RenewalFrequency =
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom'

export type WebsiteHealthStatus =
  | 'healthy'
  | 'attention'
  | 'critical'

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
  projectId?: string
  projectName?: string
  clientId?: string
  domainName?: string
  domainRenewalDate?: Date
  domainRenewalAmount?: number
  hostingRenewalDate?: Date
  hostingRenewalAmount?: number
  maintenanceFrequency?: RenewalFrequency
  maintenanceRenewalDate?: Date
  repositoryUrl?: string
  technologyStack?: string
  deploymentPlatform?: string
  healthStatus?: WebsiteHealthStatus
} & Omit<BaseEntity, 'createdBy'>

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
  projectId?: string
  projectName?: string
  clientId?: string
  domainName?: string
  domainRenewalDate?: Date | null
  domainRenewalAmount?: number
  hostingRenewalDate?: Date | null
  hostingRenewalAmount?: number
  maintenanceFrequency?: RenewalFrequency
  maintenanceRenewalDate?: Date | null
  repositoryUrl?: string
  technologyStack?: string
  deploymentPlatform?: string
  healthStatus?: WebsiteHealthStatus
}
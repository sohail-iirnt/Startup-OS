export type QuotationCompany = 'webaura' | 'iii-robotics' | 'manual'
export type QuotationServiceType = 'website' | 'app' | 'service' | 'other'
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export type QuotationExtraService = {
  id: string
  name: string
  amount: number
}

export type Quotation = {
  id: string
  workspaceId: string
  createdBy: string
  quotationNumber: string
  date: Date
  validUntil: Date | null
  company: QuotationCompany
  companyName: string
  clientName: string
  businessName: string
  contactNumber: string
  email: string
  address: string
  serviceType: QuotationServiceType
  serviceTitle: string
  serviceDescription: string
  websiteApp: string
  deliveredBy: string
  baseAmount: number
  thirdPartyCharges: number
  domainOpted: boolean
  domainCharges: number
  hostingCharges: number
  monthlyMaintenance: number
  discount: number
  extraServices: QuotationExtraService[]
  advanceAmount: number
  externalRemarks: string
  status: QuotationStatus
  createdAt: Date
  updatedAt: Date
}

export type CreateQuotationInput = Omit<Quotation, 'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'quotationNumber'>
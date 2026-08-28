export type LetterStatus = 'draft' | 'final' | 'sent'
export type LetterCompany = 'III Robotics' | 'WebAura' | 'manual'

export type Letter = {
  id: string
  workspaceId: string
  createdBy: string
  date: string
  title: string
  recipientName: string
  recipientContact: string
  recipientAddress: string
  company: LetterCompany
  manualCompanyName: string
  companyAddress: string
  companyContact: string
  logoUrl: string
  referenceNumber: string
  subject: string
  matter: string
  status: LetterStatus
  createdAt: Date
  updatedAt: Date
}

export type CreateLetterInput = Omit<Letter, 'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'updatedAt'>

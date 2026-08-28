export type WorkshopStatus = 'lead' | 'approached' | 'follow-up' | 'confirmed' | 'completed' | 'cancelled'
export type WorkshopMode = 'free' | 'paid'

export type WorkshopSession = {
  id: string
  workspaceId: string
  createdBy: string
  institutionName: string
  institutionType: 'school' | 'college' | 'university' | 'coaching' | 'company' | 'ngo' | 'other'
  institutionAddress: string
  contactPerson: string
  contactNumber: string
  contactEmail: string
  approachDate: string
  followUpDate: string
  sessionDate: string
  sessionTime: string
  topic: string
  description: string
  mode: WorkshopMode
  expectedRevenue: number
  finalRevenue: number
  participantEstimate: number
  speaker: string
  requirements: string
  status: WorkshopStatus
  notes: string
  calendarEventId?: string
  createdAt: Date
  updatedAt: Date
}

export type CreateWorkshopInput = Omit<WorkshopSession, 'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'calendarEventId'>

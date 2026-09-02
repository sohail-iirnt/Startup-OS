export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid' | 'traveling' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveRequest = {
  id: string
  workspaceId: string
  userId: string
  type: LeaveType
  customType?: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  reviewedBy?: string
  reviewNote?: string
  createdAt: Date
  updatedAt: Date
}
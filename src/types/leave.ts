export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveRequest = {
  id: string
  workspaceId: string
  userId: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  reviewedBy?: string
  reviewNote?: string
  createdAt: Date
  updatedAt: Date
}

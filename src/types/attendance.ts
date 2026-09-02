import type { ID } from './common'

export type AttendanceStatus = 'present' | 'late' | 'half-day' | 'absent' | 'leave'

export type AttendanceRecord = {
  id: ID
  workspaceId: ID
  userId: ID
  date: string
  status: AttendanceStatus
  checkIn?: Date
  checkOut?: Date
  note?: string
  markedBy: ID
  createdAt: Date
  updatedAt: Date
}
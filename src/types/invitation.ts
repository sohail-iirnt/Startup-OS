import type { UserRole } from './common'

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'expired'
  | 'revoked'

export type WorkspaceInvitation = {
  id: string
  workspaceId: string
  email?: string
  role: UserRole
  status: InvitationStatus
  createdBy: string
  createdAt: Date
  expiresAt: Date
  acceptedBy?: string
  acceptedAt?: Date
  revokedAt?: Date
  token: string
}

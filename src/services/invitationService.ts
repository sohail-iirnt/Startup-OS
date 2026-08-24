import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'

import { auth, db } from '../lib/firebase'
import type { UserRole } from '../types/common'
import type { WorkspaceInvitation } from '../types/invitation'

const WORKSPACES_COLLECTION = 'workspaces'
const INVITATIONS_COLLECTION = 'invitations'
const DEFAULT_EXPIRY_DAYS = 7

function invitationCollection(workspaceId: string) {
  return collection(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    INVITATIONS_COLLECTION,
  )
}

function createToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

export async function createWorkspaceInvitation(
  workspaceId: string,
  role: UserRole,
  email?: string,
): Promise<WorkspaceInvitation> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('You must be signed in to create an invitation.')
  }

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS)

  const token = createToken()
  const normalizedEmail = email?.trim().toLowerCase() || undefined

  const reference = await addDoc(invitationCollection(workspaceId), {
    workspaceId,
    email: normalizedEmail ?? null,
    role,
    status: 'pending',
    createdBy: user.uid,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
    token,
  })

  return {
    id: reference.id,
    workspaceId,
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    role,
    status: 'pending',
    createdBy: user.uid,
    createdAt: now,
    expiresAt,
    token,
  }
}

function toInvitation(item: {
  id: string
  data: () => Record<string, unknown>
}): WorkspaceInvitation {
  const data = item.data()
  const createdAt = data.createdAt as Timestamp
  const expiresAt = data.expiresAt as Timestamp
  const acceptedAt = data.acceptedAt as Timestamp | undefined
  const revokedAt = data.revokedAt as Timestamp | undefined

  return {
    id: item.id,
    workspaceId: data.workspaceId as string,
    email: (data.email as string | null) ?? undefined,
    role: data.role as UserRole,
    status: data.status as WorkspaceInvitation['status'],
    createdBy: data.createdBy as string,
    createdAt: createdAt.toDate(),
    expiresAt: expiresAt.toDate(),
    ...(acceptedAt ? { acceptedAt: acceptedAt.toDate() } : {}),
    ...(revokedAt ? { revokedAt: revokedAt.toDate() } : {}),
    ...(data.acceptedBy ? { acceptedBy: data.acceptedBy as string } : {}),
    token: data.token as string,
  }
}

export async function getWorkspaceInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitation[]> {
  const snapshot = await getDocs(
    query(invitationCollection(workspaceId), orderBy('createdAt', 'desc')),
  )

  return snapshot.docs.map(toInvitation)
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  await updateDoc(
    doc(
      db,
      WORKSPACES_COLLECTION,
      workspaceId,
      INVITATIONS_COLLECTION,
      invitationId,
    ),
    {
      status: 'revoked',
      revokedAt: Timestamp.now(),
    },
  )
}

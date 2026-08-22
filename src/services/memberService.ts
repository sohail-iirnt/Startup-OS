import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'
import { getUserProfile } from './userService'
import {
  approveWorkspaceMember,
  getPendingWorkspaceMembers,
  rejectWorkspaceMember,
} from './workspaceService'

const WORKSPACES_COLLECTION = 'workspaces'
const MEMBERS_COLLECTION = 'members'

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const membersRef = collection(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
  )

  const snapshot = await getDocs(
    query(
      membersRef,
      where('status', '==', 'active'),
      orderBy('joinedAt', 'asc'),
    ),
  )

  const members = await Promise.all(
    snapshot.docs.map(async (item) => {
      const member = {
        id: item.id,
        ...item.data(),
      } as WorkspaceMember

      const profile = await getUserProfile(member.userId)

      return {
        ...member,
        displayName:
          profile?.displayName ||
          member.displayName ||
          member.email ||
          'Unnamed member',
        email:
          profile?.email ||
          member.email ||
          '',
        photoURL:
          profile?.photoURL ||
          member.photoURL ||
          null,
      }
    }),
  )

  return members
}

export async function getPendingMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const members = await getPendingWorkspaceMembers(workspaceId)

  return Promise.all(
    members.map(async (member) => {
      const profile = await getUserProfile(member.userId)

      return {
        ...member,
        displayName:
          profile?.displayName ||
          member.displayName ||
          member.email ||
          'Unnamed member',
        email: profile?.email || member.email || '',
        photoURL: profile?.photoURL || member.photoURL || null,
      }
    }),
  )
}

export async function approveMember(
  workspaceId: string,
  userId: string,
  role: UserRole,
): Promise<void> {
  await approveWorkspaceMember(workspaceId, userId, role)
}

export async function rejectMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  await rejectWorkspaceMember(workspaceId, userId)
}

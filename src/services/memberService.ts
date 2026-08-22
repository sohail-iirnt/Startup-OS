import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import type { WorkspaceMember } from '../types/workspace'
import { getUserProfile } from './userService'

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

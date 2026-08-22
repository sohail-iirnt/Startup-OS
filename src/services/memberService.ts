import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import type { WorkspaceMember } from '../types/workspace'

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

  const snapshot = await getDocs(query(
    membersRef,
    where('status', '==', 'active'),
    orderBy('joinedAt', 'asc'),
  ))

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  } as WorkspaceMember))
}

import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import type {
  Workspace,
  WorkspaceMember,
} from '../types/workspace'
import {
  getUserProfile,
  setDefaultWorkspace,
} from './userService'

const WORKSPACES_COLLECTION =
  'workspaces'

const MEMBERS_COLLECTION =
  'members'

export async function createWorkspace(
  userId: string,
  name: string,
  description = '',
): Promise<Workspace> {
  const workspacesRef = collection(
    db,
    WORKSPACES_COLLECTION,
  )

  const workspaceRef = doc(
    workspacesRef,
  )

  const workspaceId =
    workspaceRef.id

  const workspaceData = {
    id: workspaceId,
    name: name.trim(),
    description: description.trim(),
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(
    workspaceRef,
    workspaceData,
  )

  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
    userId,
  )

  const memberData = {
    id: userId,
    workspaceId,
    userId,
    role: 'owner' as const,
    status: 'active' as const,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(
    memberRef,
    memberData,
  )

  const createdSnapshot =
    await getDoc(workspaceRef)

  return {
    id: createdSnapshot.id,
    ...createdSnapshot.data(),
  } as Workspace
}

export async function getWorkspace(
  workspaceId: string,
): Promise<Workspace | null> {
  const workspaceRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
  )

  const snapshot =
    await getDoc(workspaceRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Workspace
}

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMember | null> {
  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
    userId,
  )

  const snapshot =
    await getDoc(memberRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as WorkspaceMember
}

export async function initializeDefaultWorkspace(
  userId: string,
): Promise<Workspace> {
  const userProfile =
    await getUserProfile(userId)

  if (
    userProfile?.defaultWorkspaceId
  ) {
    const existingWorkspace =
      await getWorkspace(
        userProfile.defaultWorkspaceId,
      )

    if (existingWorkspace) {
      return existingWorkspace
    }
  }

  const workspace =
    await createWorkspace(
      userId,
      'WebAura By III',
      'Founder workspace for managing WebAura projects, websites, apps, clients, tasks, finance, and operations.',
    )

  await setDefaultWorkspace(
    userId,
    workspace.id,
  )

  return workspace
}
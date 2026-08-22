import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { db } from '../lib/firebase'
import type {
  Workspace,
  WorkspaceMember,
} from '../types/workspace'
import {
  getUserProfile,
  setDefaultWorkspace,
} from './userService'

const WORKSPACES_COLLECTION = 'workspaces'
const MEMBERS_COLLECTION = 'members'
const DEFAULT_WORKSPACE_NAME = 'WebAura By III'

export async function createWorkspace(
  userId: string,
  name: string,
  description = '',
): Promise<Workspace> {
  const workspacesRef = collection(
    db,
    WORKSPACES_COLLECTION,
  )

  const workspaceRef = doc(workspacesRef)
  const workspaceId = workspaceRef.id

  const workspaceData = {
    id: workspaceId,
    name: name.trim(),
    description: description.trim(),
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(workspaceRef, workspaceData)

  await setWorkspaceMember(
    workspaceId,
    userId,
    'owner',
  )

  const createdSnapshot = await getDoc(workspaceRef)

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

  const snapshot = await getDoc(workspaceRef)

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

  const snapshot = await getDoc(memberRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as WorkspaceMember
}

export async function setWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMember['role'] = 'member',
  user?: User,
): Promise<void> {
  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
    userId,
  )

  const existingSnapshot = await getDoc(memberRef)

  if (existingSnapshot.exists()) {
    return
  }

  await setDoc(memberRef, {
    id: userId,
    workspaceId,
    userId,
    role,
    status: 'active' as const,
    displayName:
      user?.displayName ||
      user?.email?.split('@')[0] ||
      'Workspace Member',
    email: user?.email || '',
    photoURL: user?.photoURL || null,
    designation:
      role === 'owner' ? 'Founder' : 'Member',
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function findDefaultWorkspace(): Promise<Workspace | null> {
  const workspacesRef = collection(
    db,
    WORKSPACES_COLLECTION,
  )

  const workspaceQuery = query(
    workspacesRef,
    where('name', '==', DEFAULT_WORKSPACE_NAME),
    limit(1),
  )

  const snapshot = await getDocs(workspaceQuery)

  if (snapshot.empty) {
    return null
  }

  const workspaceSnapshot = snapshot.docs[0]

  return {
    id: workspaceSnapshot.id,
    ...workspaceSnapshot.data(),
  } as Workspace
}

/**
 * Ensures every newly registered user enters the existing
 * company workspace instead of silently receiving a private
 * empty workspace.
 *
 * Later this can be replaced/extended by an invitation flow,
 * but for now WebAura By III is the shared Startup OS workspace.
 */
export async function initializeDefaultWorkspace(
  userId: string,
  user?: User,
): Promise<Workspace> {
  const userProfile = await getUserProfile(userId)

  if (userProfile?.defaultWorkspaceId) {
    const existingWorkspace = await getWorkspace(
      userProfile.defaultWorkspaceId,
    )

    if (existingWorkspace) {
      await setWorkspaceMember(
        existingWorkspace.id,
        userId,
        existingWorkspace.ownerId === userId
          ? 'owner'
          : 'member',
        user,
      )

      return existingWorkspace
    }
  }

  const sharedWorkspace = await findDefaultWorkspace()

  if (sharedWorkspace) {
    await setWorkspaceMember(
      sharedWorkspace.id,
      userId,
      sharedWorkspace.ownerId === userId
        ? 'owner'
        : 'member',
      user,
    )

    await setDefaultWorkspace(
      userId,
      sharedWorkspace.id,
    )

    return sharedWorkspace
  }

  const workspace = await createWorkspace(
    userId,
    DEFAULT_WORKSPACE_NAME,
    'Founder workspace for managing WebAura projects, websites, apps, clients, tasks, finance, and operations.',
  )

  await setDefaultWorkspace(
    userId,
    workspace.id,
  )

  return workspace
}

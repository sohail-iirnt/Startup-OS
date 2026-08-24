import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { db } from '../lib/firebase'
import type { Workspace, WorkspaceMember } from '../types/workspace'
import type { UserRole } from '../types/common'
import { getUserProfile, setDefaultWorkspace } from './userService'

const WORKSPACES_COLLECTION = 'workspaces'
const MEMBERS_COLLECTION = 'members'
const DEFAULT_WORKSPACE_NAME = 'WebAura By III'

export async function createWorkspace(
  userId: string,
  name: string,
  description = '',
): Promise<Workspace> {
  const normalizedName = name.trim()

  if (!normalizedName) {
    throw new Error('Workspace name is required.')
  }

  const workspacesRef = collection(db, WORKSPACES_COLLECTION)
  const workspaceRef = doc(workspacesRef)
  const workspaceId = workspaceRef.id

  await setDoc(workspaceRef, {
    id: workspaceId,
    name: normalizedName,
    description: description.trim(),
    ownerId: userId,
    workspaceCode: workspaceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setWorkspaceMember(workspaceId, userId, 'owner')
  await setDefaultWorkspace(userId, workspaceId)

  const createdSnapshot = await getDoc(workspaceRef)

  if (!createdSnapshot.exists()) {
    throw new Error('Workspace was created but could not be loaded.')
  }

  return { id: createdSnapshot.id, ...createdSnapshot.data() } as Workspace
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId)
  const snapshot = await getDoc(workspaceRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Workspace
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
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as WorkspaceMember
}

export async function setWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: UserRole = 'member',
  user?: User,
  status: WorkspaceMember['status'] = 'active',
): Promise<void> {
  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
    userId,
  )
  const existingSnapshot = await getDoc(memberRef)
  if (existingSnapshot.exists()) return

  await setDoc(memberRef, {
    id: userId,
    workspaceId,
    userId,
    role,
    status,
    displayName:
      user?.displayName || user?.email?.split('@')[0] || 'Workspace Member',
    email: user?.email || '',
    photoURL: user?.photoURL || null,
    designation: role === 'owner' ? 'Founder' : role,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function findDefaultWorkspace(): Promise<Workspace | null> {
  const snapshot = await getDocs(
    query(
      collection(db, WORKSPACES_COLLECTION),
      where('name', '==', DEFAULT_WORKSPACE_NAME),
      limit(1),
    ),
  )
  if (snapshot.empty) return null
  const item = snapshot.docs[0]
  return { id: item.id, ...item.data() } as Workspace
}

export async function initializeDefaultWorkspace(
  userId: string,
  user?: User,
): Promise<Workspace | null> {
  const userProfile = await getUserProfile(userId)

  if (userProfile?.defaultWorkspaceId) {
    const existingWorkspace = await getWorkspace(userProfile.defaultWorkspaceId)
    if (existingWorkspace) {
      // Never silently create an active membership for a non-owner.
      // Invitations and workspace join requests must remain pending until
      // an authorized workspace administrator approves them.
      return existingWorkspace
    }
  }

  const sharedWorkspace = await findDefaultWorkspace()
  if (sharedWorkspace) {
    const existingMember = await getWorkspaceMember(sharedWorkspace.id, userId)

    if (existingMember) {
      await setDefaultWorkspace(userId, sharedWorkspace.id)
      return sharedWorkspace
    }

    // Only the workspace owner may be initialized as an active member here.
    // Other users must enter through invitation/join-request approval flow.
    if (sharedWorkspace.ownerId === userId) {
      await setWorkspaceMember(
        sharedWorkspace.id,
        userId,
        'owner',
        user,
        'active',
      )
      await setDefaultWorkspace(userId, sharedWorkspace.id)
      return sharedWorkspace
    }
  }

  return null
}

export async function requestWorkspaceMembership(
  workspaceId: string,
  user: User,
  requestedRole: UserRole = 'member',
): Promise<WorkspaceMember> {
  const normalizedWorkspaceId = workspaceId.trim()
  if (!normalizedWorkspaceId) {
    throw new Error('Please enter a valid Workspace ID.')
  }

  const workspace = await getWorkspace(normalizedWorkspaceId)
  if (!workspace) {
    throw new Error('Workspace ID was not found. Please check it and try again.')
  }

  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    normalizedWorkspaceId,
    MEMBERS_COLLECTION,
    user.uid,
  )
  const existingSnapshot = await getDoc(memberRef)

  if (existingSnapshot.exists()) {
    const existing = {
      id: existingSnapshot.id,
      ...existingSnapshot.data(),
    } as WorkspaceMember

    if (existing.status === 'active') {
      await setDefaultWorkspace(user.uid, normalizedWorkspaceId)
      return existing
    }

    if (existing.status === 'pending' || existing.status === 'invited') {
      await setDefaultWorkspace(user.uid, normalizedWorkspaceId)
      return existing
    }

    if (existing.status === 'suspended') {
      throw new Error('Your membership in this workspace is suspended.')
    }

    if (existing.status === 'rejected') {
      throw new Error(
        'Your previous request was rejected. Please contact a workspace administrator.',
      )
    }
  }

  await setDoc(memberRef, {
    id: user.uid,
    workspaceId: normalizedWorkspaceId,
    userId: user.uid,
    role: requestedRole,
    status: 'pending',
    displayName:
      user.displayName || user.email?.split('@')[0] || 'Workspace Member',
    email: user.email || '',
    photoURL: user.photoURL || null,
    designation: requestedRole,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setDefaultWorkspace(user.uid, normalizedWorkspaceId)

  const createdSnapshot = await getDoc(memberRef)
  return { id: createdSnapshot.id, ...createdSnapshot.data() } as WorkspaceMember
}

export async function approveWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: UserRole = 'member',
): Promise<void> {
  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
    userId,
  )
  await updateDoc(memberRef, {
    role,
    status: 'active',
    designation: role === 'owner' ? 'Founder' : role,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function rejectWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
    userId,
  )
  await updateDoc(memberRef, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  })
}

export async function getPendingWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const membersRef = collection(
    db,
    WORKSPACES_COLLECTION,
    workspaceId,
    MEMBERS_COLLECTION,
  )
  const snapshot = await getDocs(
    query(membersRef, where('status', '==', 'pending')),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as WorkspaceMember,
  )
}

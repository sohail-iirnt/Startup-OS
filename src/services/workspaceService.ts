import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, type Unsubscribe } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { Workspace, WorkspaceMember } from '../types/workspace'
import type { UserRole } from '../types/common'
import type { WorkspacePermission } from '../types/permissions'
import { getUserProfile, setDefaultWorkspace } from './userService'
import { db } from '../lib/firebase'

const WORKSPACES_COLLECTION = 'workspaces'
const MEMBERS_COLLECTION = 'members'
const DEFAULT_WORKSPACE_NAME = 'WebAura By III'
const DEFAULT_PORTAL_NAME = 'Startup OS'
const DEFAULT_PORTAL_SUBTITLE = 'Founder Command Center'

const memberCollection = (workspaceId: string) => collection(db, WORKSPACES_COLLECTION, workspaceId, MEMBERS_COLLECTION)
const memberDocument = (workspaceId: string, userId: string) => doc(db, WORKSPACES_COLLECTION, workspaceId, MEMBERS_COLLECTION, userId)

export async function createWorkspace(userId: string, name: string, description = ''): Promise<Workspace> {
  const normalizedName = name.trim()
  if (!normalizedName) throw new Error('Workspace name is required.')
  const workspacesRef = collection(db, WORKSPACES_COLLECTION)
  const workspaceRef = doc(workspacesRef)
  const workspaceId = workspaceRef.id
  await setDoc(workspaceRef, { id: workspaceId, name: normalizedName, description: description.trim(), ownerId: userId, workspaceCode: workspaceId, portalName: DEFAULT_PORTAL_NAME, portalSubtitle: DEFAULT_PORTAL_SUBTITLE, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await setWorkspaceMember(workspaceId, userId, 'owner')
  await setDefaultWorkspace(userId, workspaceId)
  const createdSnapshot = await getDoc(workspaceRef)
  if (!createdSnapshot.exists()) throw new Error('Workspace was created but could not be loaded.')
  return { id: createdSnapshot.id, ...createdSnapshot.data() } as Workspace
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const snapshot = await getDoc(doc(db, WORKSPACES_COLLECTION, workspaceId))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Workspace) : null
}

export function subscribeToWorkspace(workspaceId: string, onChange: (workspace: Workspace | null) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(db, WORKSPACES_COLLECTION, workspaceId), snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Workspace) : null), error => onError?.(error instanceof Error ? error : new Error('Unable to listen for workspace updates.')))
}

export async function updateWorkspaceBranding(workspaceId: string, portalName: string, portalSubtitle: string): Promise<void> {
  const normalizedName = portalName.trim()
  const normalizedSubtitle = portalSubtitle.trim()
  if (!normalizedName) throw new Error('Portal name is required.')
  if (!normalizedSubtitle) throw new Error('Portal subtitle is required.')
  await updateDoc(doc(db, WORKSPACES_COLLECTION, workspaceId), { portalName: normalizedName, portalSubtitle: normalizedSubtitle, updatedAt: serverTimestamp() })
}

export async function getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
  const snapshot = await getDoc(memberDocument(workspaceId, userId))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as WorkspaceMember) : null
}

export async function getWorkspaceMemberDetails(workspaceId: string, userId: string): Promise<WorkspaceMember | null> { return getWorkspaceMember(workspaceId, userId) }

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const snapshot = await getDocs(memberCollection(workspaceId))
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as WorkspaceMember).filter(member => member.status === 'active')
}

export function subscribeToWorkspaceMember(workspaceId: string, userId: string, onChange: (member: WorkspaceMember | null) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(memberDocument(workspaceId, userId), snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as WorkspaceMember) : null), error => onError?.(error instanceof Error ? error : new Error('Unable to listen for workspace membership updates.')))
}

export function subscribeToWorkspaceMembers(workspaceId: string, onChange: (members: WorkspaceMember[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(memberCollection(workspaceId), snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as WorkspaceMember).filter(member => member.status === 'active')), error => onError?.(error instanceof Error ? error : new Error('Unable to listen for workspace members.')))
}

export function subscribeToPendingWorkspaceMembers(workspaceId: string, onChange: (members: WorkspaceMember[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const pendingQuery = query(memberCollection(workspaceId), where('status', '==', 'pending'))
  return onSnapshot(pendingQuery, snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as WorkspaceMember)), error => onError?.(error instanceof Error ? error : new Error('Unable to load pending member approvals.')))
}

export async function setWorkspaceMember(workspaceId: string, userId: string, role: UserRole = 'member', user?: User, status: WorkspaceMember['status'] = 'active'): Promise<void> {
  const memberRef = memberDocument(workspaceId, userId)
  const existingSnapshot = await getDoc(memberRef)
  if (existingSnapshot.exists()) return
  await setDoc(memberRef, { id: userId, workspaceId, userId, role, status, displayName: user?.displayName || user?.email?.split('@')[0] || 'Workspace Member', email: user?.email || '', photoURL: user?.photoURL || null, designation: role === 'owner' ? 'Founder' : role, grantedPermissions: [], deniedPermissions: [], joinedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function updateMemberPermissions(workspaceId: string, userId: string, grantedPermissions: WorkspacePermission[], deniedPermissions: WorkspacePermission[]): Promise<void> {
  await updateDoc(memberDocument(workspaceId, userId), { grantedPermissions, deniedPermissions, updatedAt: serverTimestamp() })
}

/**
 * A role change establishes a new baseline. Old role-specific overrides are cleared
 * so a member can never carry stale denials from a previous role into the new role.
 * Administrators can immediately add custom grants/denials again in Roles & Permissions.
 */
export async function updateMemberRole(workspaceId: string, userId: string, role: UserRole): Promise<void> {
  await updateDoc(memberDocument(workspaceId, userId), { role, grantedPermissions: [], deniedPermissions: [], updatedAt: serverTimestamp() })
}

async function findDefaultWorkspace(): Promise<Workspace | null> {
  const snapshot = await getDocs(query(collection(db, WORKSPACES_COLLECTION), where('name', '==', DEFAULT_WORKSPACE_NAME), limit(1)))
  if (snapshot.empty) return null
  const item = snapshot.docs[0]
  return { id: item.id, ...item.data() } as Workspace
}

export async function initializeDefaultWorkspace(userId: string, user?: User): Promise<Workspace | null> {
  const userProfile = await getUserProfile(userId)
  if (userProfile?.defaultWorkspaceId) {
    const existingWorkspace = await getWorkspace(userProfile.defaultWorkspaceId)
    if (existingWorkspace) return existingWorkspace
  }
  const sharedWorkspace = await findDefaultWorkspace()
  if (sharedWorkspace) {
    const existingMember = await getWorkspaceMember(sharedWorkspace.id, userId)
    if (existingMember) {
      if (existingMember.status === 'active') await setDefaultWorkspace(userId, sharedWorkspace.id)
      return sharedWorkspace
    }
    if (sharedWorkspace.ownerId === userId) {
      await setWorkspaceMember(sharedWorkspace.id, userId, 'owner', user, 'active')
      await setDefaultWorkspace(userId, sharedWorkspace.id)
      return sharedWorkspace
    }
  }
  return null
}

export async function requestWorkspaceMembership(workspaceId: string, user: User, requestedRole: UserRole = 'member'): Promise<WorkspaceMember> {
  const normalizedWorkspaceId = workspaceId.trim()
  if (!normalizedWorkspaceId) throw new Error('Please enter a valid Workspace ID.')
  const memberRef = memberDocument(normalizedWorkspaceId, user.uid)
  const existingSnapshot = await getDoc(memberRef)
  if (existingSnapshot.exists()) {
    const existing = { id: existingSnapshot.id, ...existingSnapshot.data() } as WorkspaceMember
    if (existing.status === 'active' || existing.status === 'pending' || existing.status === 'invited') {
      await setDefaultWorkspace(user.uid, normalizedWorkspaceId)
      return existing
    }
    if (existing.status === 'suspended') throw new Error('Your membership in this workspace is suspended.')
    if (existing.status === 'rejected') throw new Error('Your previous request was rejected. Please contact a workspace administrator.')
  }
  const membership: WorkspaceMember = {
    id: user.uid,
    workspaceId: normalizedWorkspaceId,
    userId: user.uid,
    role: requestedRole,
    status: 'pending',
    displayName: user.displayName || user.email?.split('@')[0] || 'Workspace Member',
    email: user.email || '',
    photoURL: user.photoURL || null,
    designation: requestedRole,
    grantedPermissions: [],
    deniedPermissions: [],
  }
  await setDoc(memberRef, { ...membership, joinedAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await setDefaultWorkspace(user.uid, normalizedWorkspaceId)
  return membership
}

export async function approveWorkspaceMember(workspaceId: string, userId: string, role: UserRole = 'member'): Promise<void> {
  await updateDoc(memberDocument(workspaceId, userId), { role, status: 'active', designation: role === 'owner' ? 'Founder' : role, grantedPermissions: [], deniedPermissions: [], joinedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function rejectWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await updateDoc(memberDocument(workspaceId, userId), { status: 'rejected', updatedAt: serverTimestamp() })
}

export async function getPendingWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const snapshot = await getDocs(query(memberCollection(workspaceId), where('status', '==', 'pending')))
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as WorkspaceMember)
}
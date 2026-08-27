import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, type Unsubscribe, type User } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { UserRole } from '../types/common'
import type { Workspace, WorkspaceMember } from '../types/workspace'
import type { WorkspacePermission } from '../types/permissions'

const WORKSPACES_COLLECTION = 'workspaces'
const MEMBERS_COLLECTION = 'members'

function workspaceDocument(id: string) { return doc(db, WORKSPACES_COLLECTION, id) }
function memberDocument(workspaceId: string, userId: string) { return doc(db, WORKSPACES_COLLECTION, workspaceId, MEMBERS_COLLECTION, userId) }

export async function setDefaultWorkspace(userId: string, workspaceId: string): Promise<void> { await setDoc(doc(db, 'users', userId), { defaultWorkspaceId: workspaceId, updatedAt: serverTimestamp() }, { merge: true }) }

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
    joinedAt: new Date(),
    updatedAt: new Date(),
  }
  await setDoc(memberRef, { ...membership, joinedAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await setDefaultWorkspace(user.uid, normalizedWorkspaceId)
  return membership
}

export async function approveWorkspaceMember(workspaceId: string, userId: string, role: UserRole = 'member'): Promise<void> { await updateDoc(memberDocument(workspaceId, userId), { status: 'active', role, designation: role, updatedAt: serverTimestamp() }) }

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> { const snapshot = await getDoc(workspaceDocument(workspaceId)); return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Workspace) : null }
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> { const snapshot = await getDocs(collection(db, WORKSPACES_COLLECTION, workspaceId, MEMBERS_COLLECTION)); return snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as WorkspaceMember) }
export function subscribeToWorkspace(workspaceId: string, onChange: (workspace: Workspace | null) => void, onError?: (error: Error) => void): Unsubscribe { return onSnapshot(workspaceDocument(workspaceId), snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Workspace) : null), error => onError?.(error)) }
export function subscribeToWorkspaceMember(workspaceId: string, userId: string, onChange: (member: WorkspaceMember | null) => void, onError?: (error: Error) => void): Unsubscribe { return onSnapshot(memberDocument(workspaceId, userId), snapshot => onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as WorkspaceMember) : null), error => onError?.(error)) }
export async function updateWorkspace(workspaceId: string, data: Partial<Workspace>): Promise<void> { await updateDoc(workspaceDocument(workspaceId), { ...data, updatedAt: serverTimestamp() }) }
export async function updateMemberPermissions(workspaceId: string, userId: string, grantedPermissions: WorkspacePermission[], deniedPermissions: WorkspacePermission[]): Promise<void> { await updateDoc(memberDocument(workspaceId, userId), { grantedPermissions, deniedPermissions, updatedAt: serverTimestamp() }) }

export async function findWorkspaceByCode(code: string): Promise<Workspace | null> {
  const snapshot = await getDocs(query(collection(db, WORKSPACES_COLLECTION), where('workspaceCode', '==', code.trim())))
  const first = snapshot.docs[0]
  return first ? ({ id: first.id, ...first.data() } as Workspace) : null
}

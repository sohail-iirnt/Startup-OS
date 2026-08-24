import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { UserRole } from '../types/common'
import type { WorkspaceMember } from '../types/workspace'
import { getUserProfile } from './userService'
import { approveWorkspaceMember, getPendingWorkspaceMembers, getWorkspaceMember, rejectWorkspaceMember } from './workspaceService'

const WORKSPACES_COLLECTION = 'workspaces'
const MEMBERS_COLLECTION = 'members'
function memberRef(workspaceId: string, userId: string) { return doc(db, WORKSPACES_COLLECTION, workspaceId, MEMBERS_COLLECTION, userId) }
async function enrichMember(member: WorkspaceMember): Promise<WorkspaceMember> { const profile = await getUserProfile(member.userId); return { ...member, displayName: profile?.displayName || member.displayName || member.email || 'Unnamed member', email: profile?.email || member.email || '', photoURL: profile?.photoURL || member.photoURL || null } }

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const currentUserId = auth.currentUser?.uid
  if (!currentUserId) return []
  const currentMember = await getWorkspaceMember(workspaceId, currentUserId)
  if (currentMember?.role === 'intern') return [await enrichMember(currentMember)]
  const membersRef = collection(db, WORKSPACES_COLLECTION, workspaceId, MEMBERS_COLLECTION)
  const snapshot = await getDocs(query(membersRef, where('status', '==', 'active'), orderBy('joinedAt', 'asc')))
  return Promise.all(snapshot.docs.map(async (item) => enrichMember({ id: item.id, ...item.data() } as WorkspaceMember)))
}

export async function getWorkspaceMemberDetails(workspaceId: string, userId: string): Promise<WorkspaceMember | null> { const snapshot = await getDoc(memberRef(workspaceId, userId)); if (!snapshot.exists()) return null; return enrichMember({ id: snapshot.id, ...snapshot.data() } as WorkspaceMember) }
export async function getPendingMembers(workspaceId: string): Promise<WorkspaceMember[]> { const members = await getPendingWorkspaceMembers(workspaceId); return Promise.all(members.map(enrichMember)) }
export async function approveMember(workspaceId: string, userId: string, role: UserRole): Promise<void> { await approveWorkspaceMember(workspaceId, userId, role) }
export async function rejectMember(workspaceId: string, userId: string): Promise<void> { await rejectWorkspaceMember(workspaceId, userId) }
export async function updateMemberRole(workspaceId: string, userId: string, role: UserRole): Promise<void> { await updateDoc(memberRef(workspaceId, userId), { role, designation: role === 'owner' ? 'Founder' : role, updatedAt: serverTimestamp() }) }
export async function updateMemberDesignation(workspaceId: string, userId: string, designation: string): Promise<void> { const normalized = designation.trim(); if (!normalized) throw new Error('Designation is required.'); await updateDoc(memberRef(workspaceId, userId), { designation: normalized, updatedAt: serverTimestamp() }) }
export async function suspendMember(workspaceId: string, userId: string): Promise<void> { await updateDoc(memberRef(workspaceId, userId), { status: 'suspended', updatedAt: serverTimestamp() }) }
export async function reactivateMember(workspaceId: string, userId: string): Promise<void> { await updateDoc(memberRef(workspaceId, userId), { status: 'active', updatedAt: serverTimestamp() }) }

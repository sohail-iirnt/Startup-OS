import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types/leave'

const COLLECTION = 'leaveRequests'

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return new Date(0)
}

function mapRequest(id: string, data: Record<string, unknown>): LeaveRequest {
  return { id, workspaceId: String(data.workspaceId ?? ''), userId: String(data.userId ?? ''), type: String(data.type ?? 'other') as LeaveType, startDate: String(data.startDate ?? ''), endDate: String(data.endDate ?? ''), reason: String(data.reason ?? ''), status: String(data.status ?? 'pending') as LeaveStatus, reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined, reviewNote: data.reviewNote ? String(data.reviewNote) : undefined, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) }
}

export function subscribeToLeaveRequests(workspaceId: string, userId: string, canManage: boolean, onChange: (items: LeaveRequest[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const constraints = canManage ? [where('workspaceId', '==', workspaceId), orderBy('startDate', 'desc')] : [where('workspaceId', '==', workspaceId), where('userId', '==', userId), orderBy('startDate', 'desc')]
  return onSnapshot(query(collection(db, COLLECTION), ...constraints), snapshot => onChange(snapshot.docs.map(item => mapRequest(item.id, item.data() as Record<string, unknown>))), error => onError?.(error))
}

export async function createLeaveRequest(input: { workspaceId: string; userId: string; type: LeaveType; startDate: string; endDate: string; reason: string }) {
  await addDoc(collection(db, COLLECTION), { ...input, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function reviewLeaveRequest(id: string, status: Extract<LeaveStatus, 'approved' | 'rejected'>, reviewedBy: string, reviewNote = '') {
  await updateDoc(doc(db, COLLECTION, id), { status, reviewedBy, reviewNote, updatedAt: serverTimestamp() })
}

export async function cancelLeaveRequest(id: string) {
  await updateDoc(doc(db, COLLECTION, id), { status: 'cancelled', updatedAt: serverTimestamp() })
}

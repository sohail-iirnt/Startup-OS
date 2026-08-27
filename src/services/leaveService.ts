import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types/leave'

const COLLECTION = 'leaveRequests'
function toDate(value: unknown): Date { if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate(); if (value instanceof Date) return value; if (typeof value === 'string' || typeof value === 'number') return new Date(value); return new Date(0) }
function mapRequest(id: string, data: Record<string, unknown>): LeaveRequest { return { id, workspaceId: String(data.workspaceId ?? ''), userId: String(data.userId ?? ''), type: String(data.type ?? 'other') as LeaveType, customType: data.customType ? String(data.customType) : undefined, startDate: String(data.startDate ?? ''), endDate: String(data.endDate ?? ''), reason: String(data.reason ?? ''), status: String(data.status ?? 'pending') as LeaveStatus, reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined, reviewNote: data.reviewNote ? String(data.reviewNote) : undefined, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } }

export function subscribeToLeaveRequests(workspaceId: string, userId: string, canManage: boolean, onChange: (items: LeaveRequest[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const constraints = canManage ? [where('workspaceId', '==', workspaceId)] : [where('workspaceId', '==', workspaceId), where('userId', '==', userId)]
  return onSnapshot(query(collection(db, COLLECTION), ...constraints), snapshot => { const items = snapshot.docs.map(item => mapRequest(item.id, item.data() as Record<string, unknown>)); items.sort((a, b) => b.startDate.localeCompare(a.startDate)); onChange(items) }, error => onError?.(error))
}
export async function createLeaveRequest(input: { workspaceId: string; userId: string; type: LeaveType; customType?: string; startDate: string; endDate: string; reason: string }) { await addDoc(collection(db, COLLECTION), { ...input, customType: input.type === 'other' ? input.customType?.trim() || null : null, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }) }
export async function updateLeaveRequest(id: string, input: { workspaceId: string; userId: string; type: LeaveType; customType?: string; startDate: string; endDate: string; reason: string }) {
  const reasonText = input.reason.trim()
  const newRequest = await addDoc(collection(db, COLLECTION), { workspaceId: input.workspaceId, userId: input.userId, type: input.type, customType: input.type === 'other' ? input.customType?.trim() || null : null, startDate: input.startDate, endDate: input.endDate, reason: reasonText, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), editedFrom: id })
  await updateDoc(doc(db, COLLECTION, id), { status: 'cancelled', updatedAt: serverTimestamp(), replacedBy: newRequest.id })
}
export async function reviewLeaveRequest(id: string, status: Extract<LeaveStatus, 'approved' | 'rejected'>, reviewedBy: string, reviewNote = '') { await updateDoc(doc(db, COLLECTION, id), { status, reviewedBy, reviewNote: reviewNote.trim(), updatedAt: serverTimestamp() }) }
export async function cancelLeaveRequest(id: string) { await deleteDoc(doc(db, COLLECTION, id)) }

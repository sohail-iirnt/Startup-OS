import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { CreateWorkshopInput, WorkshopSession } from '../types/workshop'

const COLLECTION = 'workshopSessions'

function asDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  const date = new Date(String(value ?? ''))
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function mapSession(id: string, data: Record<string, unknown>): WorkshopSession {
  return {
    id, workspaceId: String(data.workspaceId ?? ''), createdBy: String(data.createdBy ?? ''),
    institutionName: String(data.institutionName ?? ''), institutionType: (data.institutionType as WorkshopSession['institutionType']) ?? 'college',
    institutionAddress: String(data.institutionAddress ?? ''), contactPerson: String(data.contactPerson ?? ''), contactNumber: String(data.contactNumber ?? ''), contactEmail: String(data.contactEmail ?? ''),
    approachDate: String(data.approachDate ?? ''), followUpDate: String(data.followUpDate ?? ''), sessionDate: String(data.sessionDate ?? ''), sessionTime: String(data.sessionTime ?? ''),
    topic: String(data.topic ?? ''), description: String(data.description ?? ''), mode: (data.mode as WorkshopSession['mode']) ?? 'free',
    expectedRevenue: Number(data.expectedRevenue ?? 0), finalRevenue: Number(data.finalRevenue ?? 0), participantEstimate: Number(data.participantEstimate ?? 0),
    speaker: String(data.speaker ?? ''), requirements: String(data.requirements ?? ''), status: (data.status as WorkshopSession['status']) ?? 'lead', notes: String(data.notes ?? ''),
    calendarEventId: data.calendarEventId ? String(data.calendarEventId) : undefined, createdAt: asDate(data.createdAt), updatedAt: asDate(data.updatedAt),
  }
}

export async function getWorkshopSessions(workspaceId: string): Promise<WorkshopSession[]> {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('workspaceId', '==', workspaceId), orderBy('sessionDate', 'asc')))
  return snapshot.docs.map(item => mapSession(item.id, item.data() as Record<string, unknown>))
}

export async function createWorkshopSession(workspaceId: string, createdBy: string, input: CreateWorkshopInput): Promise<WorkshopSession> {
  const ref = await addDoc(collection(db, COLLECTION), { ...input, workspaceId, createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { ...input, id: ref.id, workspaceId, createdBy, createdAt: new Date(), updatedAt: new Date() }
}

export async function updateWorkshopSession(id: string, workspaceId: string, input: CreateWorkshopInput) {
  await updateDoc(doc(db, COLLECTION, id), { ...input, workspaceId, updatedAt: serverTimestamp() })
  return { ...input, id, workspaceId, createdBy: '', createdAt: new Date(), updatedAt: new Date() }
}

export async function deleteWorkshopSession(id: string) { await deleteDoc(doc(db, COLLECTION, id)) }

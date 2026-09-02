import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { CreateLetterInput, Letter } from '../types/letter'

const COLLECTION = 'documents'
const DOCUMENT_TYPE = 'letter'

function asDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  const d = new Date(String(value ?? ''))
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function mapLetter(id: string, data: Record<string, unknown>): Letter {
  return {
    id,
    workspaceId: String(data.workspaceId ?? ''),
    createdBy: String(data.createdBy ?? ''),
    date: String(data.date ?? ''),
    title: String(data.title ?? ''),
    letterType: (data.letterType as Letter['letterType']) ?? 'letter',
    recipientName: String(data.recipientName ?? ''),
    recipientContact: String(data.recipientContact ?? ''),
    recipientAddress: String(data.recipientAddress ?? ''),
    company: (data.company as Letter['company']) ?? 'III Robotics',
    manualCompanyName: String(data.manualCompanyName ?? ''),
    companyAddress: String(data.companyAddress ?? ''),
    companyContact: String(data.companyContact ?? ''),
    logoUrl: String(data.logoUrl ?? ''),
    referenceNumber: String(data.referenceNumber ?? ''),
    subject: String(data.subject ?? ''),
    matter: String(data.matter ?? ''),
    senderName: String(data.senderName ?? ''),
    senderPosition: String(data.senderPosition ?? ''),
    senderEmail: String(data.senderEmail ?? ''),
    status: (data.status as Letter['status']) ?? 'draft',
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  }
}

export async function getLetters(workspaceId: string): Promise<Letter[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), where('workspaceId', '==', workspaceId)))
  return snap.docs
    .map(item => ({ id: item.id, data: item.data() as Record<string, unknown> }))
    .filter(item => item.data.documentType === DOCUMENT_TYPE)
    .map(item => mapLetter(item.id, item.data))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function createLetter(workspaceId: string, createdBy: string, input: CreateLetterInput): Promise<Letter> {
  const ref = await addDoc(collection(db, COLLECTION), { ...input, documentType: DOCUMENT_TYPE, workspaceId, createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { ...input, id: ref.id, workspaceId, createdBy, createdAt: new Date(), updatedAt: new Date() }
}

export async function updateLetter(id: string, input: CreateLetterInput): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...input, documentType: DOCUMENT_TYPE, updatedAt: serverTimestamp() })
}

export async function deleteLetter(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
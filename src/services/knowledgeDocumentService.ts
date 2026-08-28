import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { CreateKnowledgeDocumentInput, KnowledgeDocument } from '../types/knowledgeDocument'

const COLLECTION = 'documents'

function toDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  return value instanceof Date ? value : null
}

function mapDocument(id: string, data: Record<string, unknown>): KnowledgeDocument {
  return {
    id,
    workspaceId: String(data.workspaceId ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: String(data.category ?? 'General'),
    url: String(data.url ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    priority: data.priority === 'low' || data.priority === 'high' ? data.priority : 'normal',
    status: data.status === 'archived' ? 'archived' : 'active',
    favorite: data.favorite === true,
    reviewDate: toDate(data.reviewDate),
    createdBy: String(data.createdBy ?? ''),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export function subscribeToKnowledgeDocuments(workspaceId: string, onData: (items: KnowledgeDocument[]) => void, onError: (error: Error) => void): Unsubscribe {
  const documentsQuery = query(collection(db, COLLECTION), where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'))
  return onSnapshot(documentsQuery, snapshot => {
    onData(snapshot.docs.map(item => mapDocument(item.id, item.data() as Record<string, unknown>)))
  }, error => onError(error))
}

export async function createKnowledgeDocument(workspaceId: string, createdBy: string, input: CreateKnowledgeDocumentInput) {
  const ref = await addDoc(collection(db, COLLECTION), {
    workspaceId,
    createdBy,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    url: input.url.trim(),
    tags: input.tags.map(tag => tag.trim()).filter(Boolean),
    priority: input.priority,
    status: input.status,
    favorite: input.favorite,
    reviewDate: input.reviewDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateKnowledgeDocument(id: string, input: CreateKnowledgeDocumentInput) {
  await updateDoc(doc(db, COLLECTION, id), {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    url: input.url.trim(),
    tags: input.tags.map(tag => tag.trim()).filter(Boolean),
    priority: input.priority,
    status: input.status,
    favorite: input.favorite,
    reviewDate: input.reviewDate,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteKnowledgeDocument(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}

export async function toggleKnowledgeDocumentFavorite(id: string, favorite: boolean) {
  await updateDoc(doc(db, COLLECTION, id), { favorite, updatedAt: serverTimestamp() })
}

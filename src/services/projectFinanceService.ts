import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type ProjectFinanceType = 'income' | 'expense'

export interface ProjectFinanceEntry {
  id: string
  workspaceId: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  type: ProjectFinanceType
  amount: number
  category: string
  description: string
  date: string
  method: string
  party: string
  createdBy: string
  createdAt?: unknown
  updatedAt?: unknown
}

export interface CreateProjectFinanceInput {
  workspaceId: string
  projectId: string
  projectName: string
  clientId?: string
  clientName?: string
  type: ProjectFinanceType
  amount: number
  category: string
  description: string
  date: string
  method: string
  party: string
  createdBy: string
}

const COLLECTION = 'financeEntries'

const normalize = (value: unknown) => String(value ?? '').trim()

export async function getProjectFinanceEntries(workspaceId: string, projectId: string) {
  const snapshot = await getDocs(query(
    collection(db, COLLECTION),
    where('workspaceId', '==', workspaceId),
    where('projectId', '==', projectId),
  ))

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() } as ProjectFinanceEntry))
    .sort((a, b) => normalize(b.date).localeCompare(normalize(a.date)))
}

export async function createProjectFinanceEntry(input: CreateProjectFinanceInput) {
  if (!input.workspaceId || !input.projectId || !input.createdBy) throw new Error('Missing required project finance information.')
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Amount must be greater than zero.')

  const ref = await addDoc(collection(db, COLLECTION), {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    projectName: normalize(input.projectName),
    clientId: normalize(input.clientId),
    clientName: normalize(input.clientName),
    type: input.type,
    amount: input.amount,
    category: normalize(input.category),
    description: normalize(input.description),
    date: normalize(input.date),
    method: normalize(input.method),
    party: normalize(input.party),
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

export async function updateProjectFinanceEntry(id: string, input: Partial<CreateProjectFinanceInput>) {
  if (!id) throw new Error('Transaction ID is required.')
  await updateDoc(doc(db, COLLECTION, id), {
    ...input,
    ...(input.projectName !== undefined ? { projectName: normalize(input.projectName) } : {}),
    ...(input.clientId !== undefined ? { clientId: normalize(input.clientId) } : {}),
    ...(input.clientName !== undefined ? { clientName: normalize(input.clientName) } : {}),
    ...(input.category !== undefined ? { category: normalize(input.category) } : {}),
    ...(input.description !== undefined ? { description: normalize(input.description) } : {}),
    ...(input.date !== undefined ? { date: normalize(input.date) } : {}),
    ...(input.method !== undefined ? { method: normalize(input.method) } : {}),
    ...(input.party !== undefined ? { party: normalize(input.party) } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProjectFinanceEntry(id: string) {
  if (!id) throw new Error('Transaction ID is required.')
  await deleteDoc(doc(db, COLLECTION, id))
}

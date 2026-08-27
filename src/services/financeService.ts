import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const FINANCE_ENTRIES_COLLECTION = 'financeEntries'

export type ProjectFinanceType = 'income' | 'expense'

export interface ProjectFinanceEntryInput {
  workspaceId: string
  projectId: string
  projectName: string
  clientId?: string
  clientName?: string
  type: ProjectFinanceType
  amount: number
  category: string
  description: string
  date: Date
  method: string
  party?: string
  createdBy: string
}

export async function createProjectFinanceEntry(input: ProjectFinanceEntryInput) {
  return addDoc(collection(db, FINANCE_ENTRIES_COLLECTION), {
    ...input,
    partyType: 'project',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProjectFinanceEntry(id: string, input: Partial<ProjectFinanceEntryInput>) {
  return updateDoc(doc(db, FINANCE_ENTRIES_COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProjectFinanceEntry(id: string) {
  return deleteDoc(doc(db, FINANCE_ENTRIES_COLLECTION, id))
}

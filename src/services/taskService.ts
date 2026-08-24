import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'

import { auth, db } from '../lib/firebase'
import type { CreateTaskInput, Task } from '../types/task'
import { getWorkspaceMember } from './workspaceService'

const TASKS_COLLECTION = 'tasks'

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate() as Date
  return null
}

function mapTask(id: string, data: Record<string, unknown>): Task {
  return { id, workspaceId: String(data.workspaceId ?? ''), createdBy: String(data.createdBy ?? ''), title: String(data.title ?? ''), projectId: (data.projectId as string | null | undefined) ?? null, clientId: (data.clientId as string | null | undefined) ?? null, assigneeId: (data.assigneeId as string | null | undefined) ?? null, status: (data.status as Task['status']) ?? 'todo', priority: (data.priority as Task['priority']) ?? 'medium', description: String(data.description ?? ''), dueDate: toDate(data.dueDate), completedAt: toDate(data.completedAt), deletedAt: toDate(data.deletedAt), createdAt: toDate(data.createdAt) ?? new Date(), updatedAt: toDate(data.updatedAt) ?? new Date() }
}

function taskQuery(workspaceId: string, role: string | undefined, uid: string | undefined) {
  const tasksRef = collection(db, TASKS_COLLECTION)
  return role === 'intern'
    ? query(tasksRef, where('workspaceId', '==', workspaceId), where('assigneeId', '==', uid ?? ''), orderBy('createdAt', 'desc'))
    : query(tasksRef, where('workspaceId', '==', workspaceId), orderBy('createdAt', 'desc'))
}

function mapSnapshot(snapshot: import('firebase/firestore').QuerySnapshot) {
  return snapshot.docs.map((item) => mapTask(item.id, item.data() as Record<string, unknown>)).filter((task) => !task.deletedAt)
}

export async function getTasks(workspaceId: string): Promise<Task[]> {
  const currentUser = auth.currentUser
  const currentMember = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  const snapshot = await getDocs(taskQuery(workspaceId, currentMember?.role, currentUser?.uid))
  return mapSnapshot(snapshot)
}

export async function subscribeToTasks(workspaceId: string, onChange: (tasks: Task[]) => void, onError: (error: Error) => void): Promise<Unsubscribe> {
  const currentUser = auth.currentUser
  const currentMember = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  if (!currentUser || !currentMember) throw new Error('Your workspace membership could not be verified.')
  return onSnapshot(taskQuery(workspaceId, currentMember.role, currentUser.uid), (snapshot) => onChange(mapSnapshot(snapshot)), (error) => onError(error instanceof Error ? error : new Error('Unable to listen for task updates.')))
}

export async function getTask(taskId: string): Promise<Task | null> {
  const snapshot = await getDoc(doc(db, TASKS_COLLECTION, taskId))
  if (!snapshot.exists()) return null
  return mapTask(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function createTask(workspaceId: string, createdBy: string, input: CreateTaskInput): Promise<Task> {
  const title = input.title.trim()
  if (!title) throw new Error('Task title is required.')
  const ref = await addDoc(collection(db, TASKS_COLLECTION), { workspaceId, createdBy, title, projectId: input.projectId ?? null, clientId: input.clientId ?? null, assigneeId: input.assigneeId ?? null, status: input.status, priority: input.priority, description: input.description.trim(), dueDate: input.dueDate ?? null, completedAt: input.status === 'completed' ? serverTimestamp() : null, deletedAt: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) throw new Error('Task was created but could not be loaded.')
  return mapTask(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function updateTask(taskId: string, workspaceId: string, input: CreateTaskInput): Promise<Task> {
  const title = input.title.trim()
  if (!title) throw new Error('Task title is required.')
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  const existing = await getDoc(taskRef)
  if (!existing.exists()) throw new Error('Task could not be found.')
  if (existing.data().workspaceId !== workspaceId) throw new Error('Task does not belong to this workspace.')
  await updateDoc(taskRef, { title, projectId: input.projectId ?? null, clientId: input.clientId ?? null, assigneeId: input.assigneeId ?? null, status: input.status, priority: input.priority, description: input.description.trim(), dueDate: input.dueDate ?? null, completedAt: input.status === 'completed' ? serverTimestamp() : null, updatedAt: serverTimestamp() })
  const snapshot = await getDoc(taskRef)
  if (!snapshot.exists()) throw new Error('Task could not be loaded after updating.')
  return mapTask(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function deleteTask(taskId: string, workspaceId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId)
  const existing = await getDoc(taskRef)
  if (!existing.exists()) throw new Error('Task could not be found.')
  if (existing.data().workspaceId !== workspaceId) throw new Error('Task does not belong to this workspace.')
  await deleteDoc(taskRef)
}

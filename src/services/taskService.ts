import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import type { CreateTaskInput, Task } from '../types/task'

const TASKS_COLLECTION = 'tasks'

function mapTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    workspaceId: String(data.workspaceId ?? ''),
    title: String(data.title ?? ''),
    projectId: (data.projectId as string | null | undefined) ?? null,
    clientId: (data.clientId as string | null | undefined) ?? null,
    assigneeId: (data.assigneeId as string | null | undefined) ?? null,
    status: (data.status as Task['status']) ?? 'todo',
    priority: (data.priority as Task['priority']) ?? 'medium',
    description: String(data.description ?? ''),
    dueDate: data.dueDate instanceof Date ? data.dueDate : null,
    completedAt: data.completedAt instanceof Date ? data.completedAt : null,
    deletedAt: data.deletedAt instanceof Date ? data.deletedAt : null,
    createdAt: data.createdAt as Task['createdAt'],
    updatedAt: data.updatedAt as Task['updatedAt'],
  }
}

export async function getTasks(workspaceId: string): Promise<Task[]> {
  const snapshot = await getDocs(query(
    collection(db, TASKS_COLLECTION),
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc'),
  ))
  return snapshot.docs
    .map((item) => mapTask(item.id, item.data() as Record<string, unknown>))
    .filter((task) => !task.deletedAt)
}

export async function getTask(taskId: string): Promise<Task | null> {
  const snapshot = await getDoc(doc(db, TASKS_COLLECTION, taskId))
  if (!snapshot.exists()) return null
  return mapTask(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function createTask(workspaceId: string, input: CreateTaskInput): Promise<Task> {
  const title = input.title.trim()
  if (!title) throw new Error('Task title is required.')

  const ref = await addDoc(collection(db, TASKS_COLLECTION), {
    workspaceId,
    title,
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    assigneeId: input.assigneeId ?? null,
    status: input.status,
    priority: input.priority,
    description: input.description.trim(),
    dueDate: input.dueDate || null,
    completedAt: input.status === 'completed' ? serverTimestamp() : null,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

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

  await updateDoc(taskRef, {
    title,
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    assigneeId: input.assigneeId ?? null,
    status: input.status,
    priority: input.priority,
    description: input.description.trim(),
    dueDate: input.dueDate || null,
    completedAt: input.status === 'completed' ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })

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

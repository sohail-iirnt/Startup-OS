import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { CreateProjectInput, Project } from '../types/project'
import { getWorkspaceMember } from './workspaceService'

const COLLECTION = 'projects'

function userId() {
  const id = auth.currentUser?.uid
  if (!id) throw new Error('You must be signed in to manage projects.')
  return id
}

function dateValue(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'string') { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date }
  return null
}

function mapProject(id: string, data: DocumentData): Project {
  return {
    id,
    workspaceId: data.workspaceId ?? '',
    createdBy: data.createdBy ?? '',
    name: data.name ?? '',
    clientId: data.clientId ?? '',
    clientName: data.clientName ?? '',
    ownerId: data.ownerId ?? '',
    ownerName: data.ownerName ?? '',
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    type: data.type ?? 'software',
    status: data.status ?? 'planning',
    priority: data.priority ?? 'medium',
    startDate: dateValue(data.startDate),
    deadline: dateValue(data.deadline),
    description: data.description ?? '',
    budget: Number(data.budget ?? 0),
    projectValue: Number(data.projectValue ?? 0),
    notes: data.notes ?? '',
    createdAt: dateValue(data.createdAt) ?? new Date(),
    updatedAt: dateValue(data.updatedAt) ?? new Date(),
  }
}

function normalize(input: CreateProjectInput) {
  const budget = Number(input.budget)
  const projectValue = Number(input.projectValue)
  if (!input.name.trim()) throw new Error('Project name is required.')
  if (!input.clientId) throw new Error('Please select a client.')
  if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(projectValue) || projectValue < 0) throw new Error('Budget and project value cannot be negative.')
  return {
    ...input,
    name: input.name.trim(),
    clientId: input.clientId.trim(),
    clientName: input.clientName.trim(),
    ownerId: input.ownerId.trim(),
    ownerName: input.ownerName.trim(),
    memberIds: Array.from(new Set(input.memberIds.filter(Boolean))),
    description: input.description.trim(),
    notes: input.notes.trim(),
    budget,
    projectValue,
    startDate: input.startDate || null,
    deadline: input.deadline || null,
  }
}

export async function getProjects(workspaceId: string) {
  if (!workspaceId) return []
  const currentUser = auth.currentUser
  const member = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  const projectsRef = collection(db, COLLECTION)
  const projectsQuery = member?.role === 'intern'
    ? query(projectsRef, where('workspaceId', '==', workspaceId), where('memberIds', 'array-contains', currentUser?.uid ?? ''))
    : query(projectsRef, where('workspaceId', '==', workspaceId))
  const snapshot = await getDocs(projectsQuery)
  return snapshot.docs.map((item) => mapProject(item.id, item.data())).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getProject(projectId: string, workspaceId: string) {
  if (!projectId || !workspaceId) return null
  const snapshot = await getDoc(doc(db, COLLECTION, projectId))
  if (!snapshot.exists()) return null
  const project = mapProject(snapshot.id, snapshot.data())
  return project.workspaceId === workspaceId ? project : null
}

export async function createProject(workspaceId: string, input: CreateProjectInput) {
  if (!workspaceId) throw new Error('Workspace is required to create a project.')
  const createdBy = userId()
  const normalized = normalize(input)
  const reference = await addDoc(collection(db, COLLECTION), {
    workspaceId,
    createdBy,
    ...normalized,
    startDate: normalized.startDate ? new Date(normalized.startDate) : null,
    deadline: normalized.deadline ? new Date(normalized.deadline) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const created = await getDoc(reference)
  if (!created.exists()) throw new Error('Project was created but could not be loaded.')
  return mapProject(created.id, created.data())
}

export async function updateProject(projectId: string, workspaceId: string, input: CreateProjectInput) {
  if (!projectId || !workspaceId) throw new Error('Project and workspace are required.')
  userId()
  const normalized = normalize(input)
  const reference = doc(db, COLLECTION, projectId)
  const existing = await getDoc(reference)
  if (!existing.exists()) throw new Error('Project could not be found.')
  if (existing.data().workspaceId !== workspaceId) throw new Error('This project does not belong to the active workspace.')
  await updateDoc(reference, {
    ...normalized,
    startDate: normalized.startDate ? new Date(normalized.startDate) : null,
    deadline: normalized.deadline ? new Date(normalized.deadline) : null,
    updatedAt: serverTimestamp(),
  })
  const updated = await getDoc(reference)
  if (!updated.exists()) throw new Error('Project was updated but could not be loaded.')
  return mapProject(updated.id, updated.data())
}

export async function deleteProject(projectId: string, workspaceId: string) {
  if (!projectId || !workspaceId) throw new Error('Project and workspace are required.')
  userId()
  const reference = doc(db, COLLECTION, projectId)
  const existing = await getDoc(reference)
  if (!existing.exists()) throw new Error('Project could not be found.')
  if (existing.data().workspaceId !== workspaceId) throw new Error('This project does not belong to the active workspace.')
  await deleteDoc(reference)
}

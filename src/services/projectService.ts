import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, type DocumentData, type Unsubscribe } from 'firebase/firestore'
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
    scope: data.scope === 'external' ? 'external' : 'internal',
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
  const scope = input.scope ?? 'internal'
  if (!input.name.trim()) throw new Error('Project name is required.')
  if (scope === 'external' && input.clientId && !input.clientName.trim()) throw new Error('Selected client information is incomplete.')
  if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(projectValue) || projectValue < 0) throw new Error('Budget and project value cannot be negative.')
  return {
    ...input,
    scope,
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

function projectQuery(workspaceId: string, role: string | undefined, uid: string | undefined) {
  const projectsRef = collection(db, COLLECTION)
  return role === 'intern'
    ? query(projectsRef, where('workspaceId', '==', workspaceId), where('memberIds', 'array-contains', uid ?? ''))
    : query(projectsRef, where('workspaceId', '==', workspaceId))
}

export async function getProjects(workspaceId: string) {
  if (!workspaceId) return []
  const currentUser = auth.currentUser
  const member = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  const snapshot = await getDocs(projectQuery(workspaceId, member?.role, currentUser?.uid))
  return snapshot.docs.map((item) => mapProject(item.id, item.data())).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function subscribeToProjects(workspaceId: string, onChange: (projects: Project[]) => void, onError: (error: Error) => void): Promise<Unsubscribe> {
  const currentUser = auth.currentUser
  const member = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  if (!currentUser || !member) throw new Error('Your workspace membership could not be verified.')
  const unsubscribe = onSnapshot(projectQuery(workspaceId, member.role, currentUser.uid),
    (snapshot) => onChange(snapshot.docs.map((item) => mapProject(item.id, item.data())).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())),
    (error) => onError(error instanceof Error ? error : new Error('Unable to listen for project updates.')),
  )
  return unsubscribe
}

export async function getProject(projectId: string, workspaceId: string) {
  if (!projectId || !workspaceId) return null
  const currentUser = auth.currentUser
  const member = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  if (!currentUser || !member) throw new Error('Your workspace membership could not be verified.')

  const snapshot = await getDocs(projectQuery(workspaceId, member.role, currentUser.uid))
  const matching = snapshot.docs.find((item) => item.id === projectId)
  return matching ? mapProject(matching.id, matching.data()) : null
}

export async function subscribeToProject(projectId: string, workspaceId: string, onChange: (project: Project | null) => void, onError: (error: Error) => void): Promise<Unsubscribe> {
  if (!projectId || !workspaceId) throw new Error('Project and workspace are required.')
  const currentUser = auth.currentUser
  const member = currentUser ? await getWorkspaceMember(workspaceId, currentUser.uid) : null
  if (!currentUser || !member) throw new Error('Your workspace membership could not be verified.')

  return onSnapshot(projectQuery(workspaceId, member.role, currentUser.uid),
    (snapshot) => {
      const matching = snapshot.docs.find((item) => item.id === projectId)
      onChange(matching ? mapProject(matching.id, matching.data()) : null)
    },
    (error) => onError(error instanceof Error ? error : new Error('Unable to listen for project updates.')),
  )
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
  await updateDoc(reference, { ...normalized, startDate: normalized.startDate ? new Date(normalized.startDate) : null, deadline: normalized.deadline ? new Date(normalized.deadline) : null, updatedAt: serverTimestamp() })
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
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
  type DocumentData,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import type { CreateWebsiteInput, Website } from '../types/website'

const WEBSITES_COLLECTION = 'websites'

function toDate(value: unknown): Date | undefined {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  return value instanceof Date ? value : undefined
}

function mapWebsite(id: string, data: DocumentData): Website {
  return {
    id,
    name: data.name ?? '',
    clientName: data.clientName ?? '',
    type: data.type ?? 'website',
    status: data.status ?? 'in-development',
    liveUrl: data.liveUrl ?? '',
    hostingProvider: data.hostingProvider ?? '',
    developmentAmount: Number(data.developmentAmount ?? 0),
    maintenanceOpted: Boolean(data.maintenanceOpted),
    monthlyMaintenanceCharge: Number(data.monthlyMaintenanceCharge ?? 0),
    notes: data.notes ?? '',
    projectId: data.projectId ?? undefined,
    projectName: data.projectName ?? undefined,
    clientId: data.clientId ?? undefined,
    domainName: data.domainName ?? undefined,
    domainRenewalDate: toDate(data.domainRenewalDate),
    domainRenewalAmount: Number(data.domainRenewalAmount ?? 0) || undefined,
    hostingRenewalDate: toDate(data.hostingRenewalDate),
    hostingRenewalAmount: Number(data.hostingRenewalAmount ?? 0) || undefined,
    maintenanceFrequency: data.maintenanceFrequency ?? undefined,
    maintenanceRenewalDate: toDate(data.maintenanceRenewalDate),
    repositoryUrl: data.repositoryUrl ?? undefined,
    technologyStack: data.technologyStack ?? undefined,
    deploymentPlatform: data.deploymentPlatform ?? undefined,
    healthStatus: data.healthStatus ?? undefined,
    workspaceId: data.workspaceId ?? '',
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
  }
}

function websitePayload(input: CreateWebsiteInput) {
  return {
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    type: input.type,
    status: input.status,
    liveUrl: input.liveUrl.trim(),
    hostingProvider: input.hostingProvider.trim(),
    developmentAmount: Number(input.developmentAmount) || 0,
    maintenanceOpted: input.maintenanceOpted,
    monthlyMaintenanceCharge: input.maintenanceOpted ? Number(input.monthlyMaintenanceCharge) || 0 : 0,
    notes: input.notes.trim(),
    projectId: input.projectId?.trim() || null,
    projectName: input.projectName?.trim() || null,
    clientId: input.clientId?.trim() || null,
    domainName: input.domainName?.trim() || null,
    domainRenewalDate: input.domainRenewalDate ?? null,
    domainRenewalAmount: Number(input.domainRenewalAmount) || 0,
    hostingRenewalDate: input.hostingRenewalDate ?? null,
    hostingRenewalAmount: Number(input.hostingRenewalAmount) || 0,
    maintenanceFrequency: input.maintenanceFrequency ?? null,
    maintenanceRenewalDate: input.maintenanceRenewalDate ?? null,
    repositoryUrl: input.repositoryUrl?.trim() || null,
    technologyStack: input.technologyStack?.trim() || null,
    deploymentPlatform: input.deploymentPlatform?.trim() || null,
  }
}

export async function getWebsites(workspaceId: string): Promise<Website[]> {
  if (!workspaceId) return []
  const snapshot = await getDocs(query(
    collection(db, WEBSITES_COLLECTION),
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc'),
  ))
  return snapshot.docs.map((document) => mapWebsite(document.id, document.data()))
}

export async function getWebsite(websiteId: string): Promise<Website | null> {
  if (!websiteId) return null
  const snapshot = await getDoc(doc(db, WEBSITES_COLLECTION, websiteId))
  return snapshot.exists() ? mapWebsite(snapshot.id, snapshot.data()) : null
}

export async function createWebsite(workspaceId: string, input: CreateWebsiteInput): Promise<Website> {
  if (!workspaceId) throw new Error('Workspace is required to create a website.')
  if (!input.name.trim()) throw new Error('Website or app name is required.')

  const documentReference = await addDoc(collection(db, WEBSITES_COLLECTION), {
    workspaceId,
    ...websitePayload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const created = await getDoc(documentReference)
  if (!created.exists()) throw new Error('Website was created but could not be loaded.')
  return mapWebsite(created.id, created.data())
}

export async function updateWebsite(websiteId: string, input: CreateWebsiteInput): Promise<Website>
export async function updateWebsite(websiteId: string, workspaceId: string, input: CreateWebsiteInput): Promise<Website>
export async function updateWebsite(websiteId: string, workspaceIdOrInput: string | CreateWebsiteInput, maybeInput?: CreateWebsiteInput): Promise<Website> {
  const workspaceId = typeof workspaceIdOrInput === 'string' ? workspaceIdOrInput : undefined
  const input = typeof workspaceIdOrInput === 'string' ? maybeInput : workspaceIdOrInput
  if (!websiteId) throw new Error('Website ID is required.')
  if (!input) throw new Error('Website update data is required.')
  if (!input.name.trim()) throw new Error('Website or app name is required.')

  const websiteRef = doc(db, WEBSITES_COLLECTION, websiteId)
  const existing = await getDoc(websiteRef)
  if (!existing.exists()) throw new Error('Website could not be found.')
  if (workspaceId && existing.data().workspaceId !== workspaceId) throw new Error('Website does not belong to this workspace.')

  await updateDoc(websiteRef, { ...websitePayload(input), updatedAt: serverTimestamp() })
  const updated = await getDoc(websiteRef)
  if (!updated.exists()) throw new Error('Website was updated but could not be loaded.')
  return mapWebsite(updated.id, updated.data())
}

export async function deleteWebsite(websiteId: string): Promise<void>
export async function deleteWebsite(websiteId: string, workspaceId: string): Promise<void>
export async function deleteWebsite(websiteId: string, workspaceId?: string): Promise<void> {
  if (!websiteId) throw new Error('Website ID is required.')
  const websiteRef = doc(db, WEBSITES_COLLECTION, websiteId)
  const existing = await getDoc(websiteRef)
  if (!existing.exists()) throw new Error('Website could not be found.')
  if (workspaceId && existing.data().workspaceId !== workspaceId) throw new Error('Website does not belong to this workspace.')
  await deleteDoc(websiteRef)
}
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
import type {
  CreateWebsiteInput,
  Website,
} from '../types/website'

const WEBSITES_COLLECTION = 'websites'

function mapWebsite(
  id: string,
  data: DocumentData,
): Website {
  return {
    id,
    name: data.name ?? '',
    clientName: data.clientName ?? '',
    type: data.type ?? 'website',
    status: data.status ?? 'in-development',
    liveUrl: data.liveUrl ?? '',
    hostingProvider:
      data.hostingProvider ?? '',
    developmentAmount:
      Number(data.developmentAmount ?? 0),
    maintenanceOpted:
      Boolean(data.maintenanceOpted),
    monthlyMaintenanceCharge:
      Number(
        data.monthlyMaintenanceCharge ?? 0,
      ),
    notes: data.notes ?? '',
    workspaceId: data.workspaceId ?? '',
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : new Date(),
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : new Date(),
  }
}

export async function getWebsites(
  workspaceId: string,
): Promise<Website[]> {
  if (!workspaceId) {
    return []
  }

  const websitesRef = collection(
    db,
    WEBSITES_COLLECTION,
  )

  const websitesQuery = query(
    websitesRef,
    where(
      'workspaceId',
      '==',
      workspaceId,
    ),
    orderBy('createdAt', 'desc'),
  )

  const snapshot =
    await getDocs(websitesQuery)

  return snapshot.docs.map(
    (document) =>
      mapWebsite(
        document.id,
        document.data(),
      ),
  )
}

export async function getWebsite(
  websiteId: string,
): Promise<Website | null> {
  if (!websiteId) {
    return null
  }

  const websiteRef = doc(
    db,
    WEBSITES_COLLECTION,
    websiteId,
  )

  const snapshot =
    await getDoc(websiteRef)

  if (!snapshot.exists()) {
    return null
  }

  return mapWebsite(
    snapshot.id,
    snapshot.data(),
  )
}

export async function createWebsite(
  workspaceId: string,
  input: CreateWebsiteInput,
): Promise<Website> {
  if (!workspaceId) {
    throw new Error(
      'Workspace is required to create a website.',
    )
  }

  if (!input.name.trim()) {
    throw new Error(
      'Website or app name is required.',
    )
  }

  const websitesRef = collection(
    db,
    WEBSITES_COLLECTION,
  )

  const documentReference =
    await addDoc(websitesRef, {
      workspaceId,
      name: input.name.trim(),
      clientName:
        input.clientName.trim(),
      type: input.type,
      status: input.status,
      liveUrl: input.liveUrl.trim(),
      hostingProvider:
        input.hostingProvider.trim(),
      developmentAmount:
        Number(input.developmentAmount) || 0,
      maintenanceOpted:
        input.maintenanceOpted,
      monthlyMaintenanceCharge:
        input.maintenanceOpted
          ? Number(
              input.monthlyMaintenanceCharge,
            ) || 0
          : 0,
      notes: input.notes.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

  const created =
    await getDoc(documentReference)

  if (!created.exists()) {
    throw new Error(
      'Website was created but could not be loaded.',
    )
  }

  return mapWebsite(
    created.id,
    created.data(),
  )
}

export async function updateWebsite(
  websiteId: string,
  input: CreateWebsiteInput,
): Promise<Website>

export async function updateWebsite(
  websiteId: string,
  workspaceId: string,
  input: CreateWebsiteInput,
): Promise<Website>

export async function updateWebsite(
  websiteId: string,
  workspaceIdOrInput: string | CreateWebsiteInput,
  maybeInput?: CreateWebsiteInput,
): Promise<Website> {
  if (!websiteId) {
    throw new Error(
      'Website ID is required.',
    )
  }

  const workspaceId =
    typeof workspaceIdOrInput === 'string'
      ? workspaceIdOrInput
      : undefined
  const input =
    typeof workspaceIdOrInput === 'string'
      ? maybeInput
      : workspaceIdOrInput

  if (!input) {
    throw new Error(
      'Website update data is required.',
    )
  }

  if (!input.name.trim()) {
    throw new Error(
      'Website or app name is required.',
    )
  }

  const websiteRef = doc(
    db,
    WEBSITES_COLLECTION,
    websiteId,
  )

  const existing = await getDoc(websiteRef)

  if (!existing.exists()) {
    throw new Error(
      'Website could not be found.',
    )
  }

  if (
    workspaceId &&
    existing.data().workspaceId !== workspaceId
  ) {
    throw new Error(
      'Website does not belong to this workspace.',
    )
  }

  await updateDoc(websiteRef, {
    name: input.name.trim(),
    clientName:
      input.clientName.trim(),
    type: input.type,
    status: input.status,
    liveUrl: input.liveUrl.trim(),
    hostingProvider:
      input.hostingProvider.trim(),
    developmentAmount:
      Number(input.developmentAmount) || 0,
    maintenanceOpted:
      input.maintenanceOpted,
    monthlyMaintenanceCharge:
      input.maintenanceOpted
        ? Number(
            input.monthlyMaintenanceCharge,
          ) || 0
        : 0,
    notes: input.notes.trim(),
    updatedAt: serverTimestamp(),
  })

  const updated = await getDoc(websiteRef)

  if (!updated.exists()) {
    throw new Error(
      'Website was updated but could not be loaded.',
    )
  }

  return mapWebsite(
    updated.id,
    updated.data(),
  )
}

export async function deleteWebsite(
  websiteId: string,
): Promise<void>

export async function deleteWebsite(
  websiteId: string,
  workspaceId: string,
): Promise<void>

export async function deleteWebsite(
  websiteId: string,
  workspaceId?: string,
): Promise<void> {
  if (!websiteId) {
    throw new Error(
      'Website ID is required.',
    )
  }

  const websiteRef = doc(
    db,
    WEBSITES_COLLECTION,
    websiteId,
  )

  const existing = await getDoc(websiteRef)

  if (!existing.exists()) {
    throw new Error(
      'Website could not be found.',
    )
  }

  if (
    workspaceId &&
    existing.data().workspaceId !== workspaceId
  ) {
    throw new Error(
      'Website does not belong to this workspace.',
    )
  }

  await deleteDoc(websiteRef)
}
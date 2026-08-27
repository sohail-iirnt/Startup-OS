import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { CreateQuotationInput, Quotation, QuotationExtraService } from '../types/quotation'
import { getWorkspaceMember } from './workspaceService'

const QUOTATIONS_COLLECTION = 'quotations'

function currentUserId() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('You must be signed in to manage quotations.')
  return uid
}

function asDate(value: unknown, fallback: Date | null = null) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? fallback : date
  }
  return fallback
}

function mapQuotation(id: string, data: DocumentData): Quotation {
  const extras = Array.isArray(data.extraServices) ? data.extraServices : []
  return {
    id,
    workspaceId: data.workspaceId ?? '',
    createdBy: data.createdBy ?? '',
    quotationNumber: data.quotationNumber ?? `Q-${id.slice(0, 6).toUpperCase()}`,
    date: asDate(data.date, new Date()) ?? new Date(),
    validUntil: asDate(data.validUntil, null),
    company: data.company ?? 'webaura',
    companyName: data.companyName ?? 'WebAura By III',
    clientName: data.clientName ?? '',
    businessName: data.businessName ?? '',
    contactNumber: data.contactNumber ?? '',
    email: data.email ?? '',
    address: data.address ?? '',
    serviceType: data.serviceType ?? 'website',
    serviceTitle: data.serviceTitle ?? '',
    serviceDescription: data.serviceDescription ?? '',
    websiteApp: data.websiteApp ?? '',
    deliveredBy: data.deliveredBy ?? '',
    baseAmount: Number(data.baseAmount ?? 0),
    thirdPartyCharges: Number(data.thirdPartyCharges ?? 0),
    domainOpted: Boolean(data.domainOpted),
    domainCharges: Number(data.domainCharges ?? 0),
    hostingCharges: Number(data.hostingCharges ?? 0),
    monthlyMaintenance: Number(data.monthlyMaintenance ?? 0),
    discount: Number(data.discount ?? 0),
    extraServices: extras.map((item: Partial<QuotationExtraService>, index: number) => ({ id: item.id ?? `extra-${index}`, name: item.name ?? '', amount: Number(item.amount ?? 0) })),
    advanceAmount: Number(data.advanceAmount ?? 0),
    externalRemarks: data.externalRemarks ?? '',
    status: data.status ?? 'draft',
    createdAt: asDate(data.createdAt, new Date()) ?? new Date(),
    updatedAt: asDate(data.updatedAt, new Date()) ?? new Date(),
  }
}

function normalizeInput(input: CreateQuotationInput) {
  const extraServices = input.extraServices.filter((item) => item.name.trim()).map((item) => ({ id: item.id, name: item.name.trim(), amount: Math.max(0, Number(item.amount) || 0) }))
  return {
    ...input,
    companyName: input.companyName.trim(),
    clientName: input.clientName.trim(),
    businessName: input.businessName.trim(),
    contactNumber: input.contactNumber.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    serviceTitle: input.serviceTitle.trim(),
    serviceDescription: input.serviceDescription.trim(),
    websiteApp: input.websiteApp.trim(),
    deliveredBy: input.deliveredBy.trim(),
    externalRemarks: input.externalRemarks.trim(),
    baseAmount: Math.max(0, Number(input.baseAmount) || 0),
    thirdPartyCharges: Math.max(0, Number(input.thirdPartyCharges) || 0),
    domainCharges: input.domainOpted ? Math.max(0, Number(input.domainCharges) || 0) : 0,
    hostingCharges: Math.max(0, Number(input.hostingCharges) || 0),
    monthlyMaintenance: Math.max(0, Number(input.monthlyMaintenance) || 0),
    discount: Math.max(0, Number(input.discount) || 0),
    advanceAmount: Math.max(0, Number(input.advanceAmount) || 0),
    extraServices,
  }
}

async function assertWorkspaceAccess(workspaceId: string) {
  const uid = currentUserId()
  const member = await getWorkspaceMember(workspaceId, uid)
  if (!member || member.status !== 'active') throw new Error('You do not have access to this workspace.')
}

async function nextQuotationNumber(workspaceId: string) {
  const year = new Date().getFullYear()
  const snapshot = await getDocs(query(collection(db, QUOTATIONS_COLLECTION), where('workspaceId', '==', workspaceId)))
  const numbers = snapshot.docs.map((item) => String(item.data().quotationNumber ?? '')).filter((value) => value.startsWith(`QUO-${year}-`)).map((value) => Number(value.split('-').pop())).filter(Number.isFinite)
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `QUO-${year}-${String(next).padStart(4, '0')}`
}

export async function getQuotations(workspaceId: string): Promise<Quotation[]> {
  if (!workspaceId) return []
  await assertWorkspaceAccess(workspaceId)
  const snapshot = await getDocs(query(collection(db, QUOTATIONS_COLLECTION), where('workspaceId', '==', workspaceId)))
  return snapshot.docs.map((item) => mapQuotation(item.id, item.data())).sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function createQuotation(workspaceId: string, input: CreateQuotationInput): Promise<Quotation> {
  if (!workspaceId) throw new Error('Workspace is required to create a quotation.')
  await assertWorkspaceAccess(workspaceId)
  if (!input.clientName.trim()) throw new Error('Client name is required.')
  if (!input.serviceTitle.trim()) throw new Error('Quotation service is required.')
  const createdBy = currentUserId()
  const normalized = normalizeInput(input)
  const quotationNumber = await nextQuotationNumber(workspaceId)
  const reference = await addDoc(collection(db, QUOTATIONS_COLLECTION), { workspaceId, createdBy, quotationNumber, ...normalized, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  const created = await getDoc(reference)
  if (!created.exists()) throw new Error('Quotation was created but could not be loaded.')
  return mapQuotation(created.id, created.data())
}

export async function updateQuotation(quotationId: string, workspaceId: string, input: CreateQuotationInput): Promise<Quotation> {
  if (!quotationId || !workspaceId) throw new Error('Quotation and workspace are required.')
  await assertWorkspaceAccess(workspaceId)
  if (!input.clientName.trim()) throw new Error('Client name is required.')
  if (!input.serviceTitle.trim()) throw new Error('Quotation service is required.')
  const reference = doc(db, QUOTATIONS_COLLECTION, quotationId)
  const existing = await getDoc(reference)
  if (!existing.exists()) throw new Error('Quotation could not be found.')
  if (existing.data().workspaceId !== workspaceId) throw new Error('This quotation does not belong to the active workspace.')
  await updateDoc(reference, { ...normalizeInput(input), updatedAt: serverTimestamp() })
  const updated = await getDoc(reference)
  if (!updated.exists()) throw new Error('Quotation was updated but could not be loaded.')
  return mapQuotation(updated.id, updated.data())
}

export async function deleteQuotation(quotationId: string, workspaceId: string): Promise<void> {
  if (!quotationId || !workspaceId) throw new Error('Quotation and workspace are required.')
  await assertWorkspaceAccess(workspaceId)
  const reference = doc(db, QUOTATIONS_COLLECTION, quotationId)
  const existing = await getDoc(reference)
  if (!existing.exists()) throw new Error('Quotation could not be found.')
  if (existing.data().workspaceId !== workspaceId) throw new Error('This quotation does not belong to the active workspace.')
  await deleteDoc(reference)
}

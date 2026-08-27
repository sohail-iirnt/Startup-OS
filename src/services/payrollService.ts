import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch, type Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PayrollForm, PayrollRecord } from '../types/payroll'

const COLLECTION = 'payrollRecords'
const FINANCE_COLLECTION = 'financeEntries'

function asDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  const date = new Date(String(value ?? ''))
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function mapRecord(id: string, data: Record<string, unknown>): PayrollRecord {
  return {
    id,
    workspaceId: String(data.workspaceId ?? ''),
    paidToUserId: data.paidToUserId ? String(data.paidToUserId) : undefined,
    paidTo: String(data.paidTo ?? ''),
    recipientType: (data.recipientType as PayrollRecord['recipientType']) ?? 'other',
    paymentType: (data.paymentType as PayrollRecord['paymentType']) ?? 'custom',
    customPaymentType: data.customPaymentType ? String(data.customPaymentType) : undefined,
    paidDate: asDate(data.paidDate),
    paymentMethod: (data.paymentMethod as PayrollRecord['paymentMethod']) ?? 'online',
    paidBy: String(data.paidBy ?? ''),
    periodStart: data.periodStart ? String(data.periodStart) : undefined,
    periodEnd: data.periodEnd ? String(data.periodEnd) : undefined,
    baseAmount: Number(data.baseAmount ?? 0),
    incentiveAmount: Number(data.incentiveAmount ?? 0),
    totalAmount: Number(data.totalAmount ?? 0),
    notes: data.notes ? String(data.notes) : undefined,
    createdBy: String(data.createdBy ?? ''),
    createdAt: data.createdAt ? asDate(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? asDate(data.updatedAt) : undefined,
  }
}

export function subscribeToPayroll(workspaceId: string, onChange: (records: PayrollRecord[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const q = query(collection(db, COLLECTION), where('workspaceId', '==', workspaceId), orderBy('paidDate', 'desc'))
  return onSnapshot(q, snapshot => onChange(snapshot.docs.map(item => mapRecord(item.id, item.data() as Record<string, unknown>))), error => onError?.(error))
}

export async function savePayroll(workspaceId: string, userId: string, form: PayrollForm, existingId?: string): Promise<void> {
  const baseAmount = Number(form.baseAmount)
  const incentiveAmount = Number(form.incentiveAmount || 0)
  const totalAmount = baseAmount + incentiveAmount
  if (!workspaceId || !userId || !form.paidTo.trim() || !form.paidBy.trim() || baseAmount <= 0 || incentiveAmount < 0 || !form.paidDate) throw new Error('Please complete all required payroll fields.')
  if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart) throw new Error('Payroll period end date cannot be before the start date.')
  const paymentType = form.paymentType === 'custom' ? (form.customPaymentType.trim() || 'Other') : form.paymentType
  const payrollRef = existingId ? doc(db, COLLECTION, existingId) : doc(collection(db, COLLECTION))
  const financeRef = existingId ? doc(db, FINANCE_COLLECTION, `payroll-${existingId}`) : doc(collection(db, FINANCE_COLLECTION))
  const batch = writeBatch(db)
  const payrollData = {
    workspaceId, paidToUserId: form.paidToUserId || null, paidTo: form.paidTo.trim(), recipientType: form.recipientType,
    paymentType, customPaymentType: form.paymentType === 'custom' ? form.customPaymentType.trim() : null,
    paidDate: new Date(`${form.paidDate}T12:00:00`), paymentMethod: form.paymentMethod, paidBy: form.paidBy.trim(),
    periodStart: form.periodStart || null, periodEnd: form.periodEnd || null, baseAmount, incentiveAmount, totalAmount,
    notes: form.notes.trim(), createdBy: userId, updatedAt: serverTimestamp(),
  }
  if (existingId) batch.update(payrollRef, payrollData)
  else batch.set(payrollRef, { ...payrollData, createdAt: serverTimestamp() })
  batch.set(financeRef, {
    workspaceId, type: 'payroll', amount: totalAmount, category: 'Payroll', description: `${paymentType} payment to ${form.paidTo.trim()}`,
    date: new Date(`${form.paidDate}T12:00:00`), method: form.paymentMethod, party: form.paidTo.trim(), partyType: form.recipientType,
    payPeriod: form.periodStart && form.periodEnd ? `${form.periodStart} to ${form.periodEnd}` : '', payrollId: payrollRef.id,
    baseAmount, incentiveAmount, createdBy: userId, updatedAt: serverTimestamp(), ...(existingId ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true })
  await batch.commit()
}

export async function deletePayroll(id: string): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, COLLECTION, id))
  batch.delete(doc(db, FINANCE_COLLECTION, `payroll-${id}`))
  await batch.commit()
}

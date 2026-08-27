import type { Timestamp } from 'firebase/firestore'

export type PayrollPaymentType = 'salary' | 'stipend' | 'referral' | 'custom'
export type PayrollRecipientType = 'intern' | 'member' | 'employee' | 'freelancer' | 'other'
export type PayrollPaymentMethod = 'cash' | 'online'

export type PayrollRecord = {
  id: string
  workspaceId: string
  paidToUserId?: string
  paidTo: string
  recipientType: PayrollRecipientType
  paymentType: PayrollPaymentType
  customPaymentType?: string
  paidDate: Date | Timestamp
  paymentMethod: PayrollPaymentMethod
  paidBy: string
  periodStart?: string
  periodEnd?: string
  baseAmount: number
  incentiveAmount: number
  totalAmount: number
  notes?: string
  createdBy: string
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export type PayrollForm = {
  paidToUserId: string
  paidTo: string
  recipientType: PayrollRecipientType
  paymentType: PayrollPaymentType
  customPaymentType: string
  paidDate: string
  paymentMethod: PayrollPaymentMethod
  paidBy: string
  periodStart: string
  periodEnd: string
  baseAmount: string
  incentiveAmount: string
  notes: string
}

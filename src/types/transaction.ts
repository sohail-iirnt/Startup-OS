import type {
  BaseEntity,
  ID,
} from './common'

export type TransactionType =
  | 'income'
  | 'expense'

export type Transaction = BaseEntity & {
  type: TransactionType

  amount: number
  currency: string

  category: string

  description?: string
  reference?: string

  clientId?: ID | null
  projectId?: ID | null

  transactionDate: Date

  deletedAt?: Date | null
}
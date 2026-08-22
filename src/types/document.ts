import type {
  BaseEntity,
  ID,
} from './common'

export type Document = BaseEntity & {
  uploadedBy: ID

  name: string
  originalName: string
  mimeType: string
  size: number

  storagePath: string
  downloadUrl?: string

  entityType?: string
  entityId?: ID

  deletedAt?: Date | null
}
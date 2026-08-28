export type KnowledgeDocumentPriority = 'low' | 'normal' | 'high'
export type KnowledgeDocumentStatus = 'active' | 'archived'

export type KnowledgeDocument = {
  id: string
  workspaceId: string
  title: string
  description: string
  category: string
  url: string
  tags: string[]
  priority: KnowledgeDocumentPriority
  status: KnowledgeDocumentStatus
  favorite: boolean
  reviewDate: Date | null
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export type CreateKnowledgeDocumentInput = Omit<KnowledgeDocument, 'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'updatedAt'>

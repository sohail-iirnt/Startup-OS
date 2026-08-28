export type NotificationCategory = 'system' | 'task' | 'project' | 'calendar' | 'attendance' | 'leave' | 'quotation' | 'finance' | 'client' | 'team'
export type NotificationPriority = 'normal' | 'important' | 'urgent'

export type NotificationItem = {
  id: string
  workspaceId: string
  recipientId: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  read: boolean
  actionPath?: string
  createdBy?: string
  createdAt: Date
}

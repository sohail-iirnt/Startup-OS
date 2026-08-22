import { createContext } from 'react'
import type { Workspace, WorkspaceMember } from '../types/workspace'
import type { WorkspacePermission } from '../types/permissions'

export type WorkspaceContextValue = {
  workspace: Workspace | null
  member: WorkspaceMember | null
  loading: boolean
  hasWorkspaceAccess: boolean
  hasPermission: (permission: WorkspacePermission) => boolean
  refreshWorkspace: () => Promise<void>
}

export const WorkspaceContext =
  createContext<WorkspaceContextValue | undefined>(undefined)

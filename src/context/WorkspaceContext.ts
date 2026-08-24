import { createContext } from 'react'
import type { WorkspacePermission } from '../types/permissions'
import type { Workspace } from '../types/workspace'
import type { WorkspaceMember } from '../types/workspace'

export type WorkspaceContextValue = {
  workspace: Workspace | null
  member: WorkspaceMember | null
  loading: boolean
  hasWorkspaceAccess: boolean
  hasPermission: (permission: WorkspacePermission) => boolean
  refreshWorkspace: () => Promise<void>
}

export const WorkspaceContext =
  createContext<WorkspaceContextValue | undefined>(
    undefined,
  )

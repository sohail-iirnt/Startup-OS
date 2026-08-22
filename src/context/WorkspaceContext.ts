import { createContext } from 'react'
import type { Workspace } from '../types/workspace'

export type WorkspaceContextValue = {
  workspace: Workspace | null
  loading: boolean
  refreshWorkspace: () => Promise<void>
}

export const WorkspaceContext =
  createContext<WorkspaceContextValue | undefined>(
    undefined,
  )
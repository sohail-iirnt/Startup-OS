import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from './useAuth'
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from './WorkspaceContext'

import {
  getWorkspace,
  getWorkspaceMember,
  initializeDefaultWorkspace,
} from '../services/workspaceService'
import { roleHasPermission } from '../types/permissions'
import type { WorkspaceMember } from '../types/workspace'

type WorkspaceProviderProps = {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, loading: authLoading } = useAuth()

  const [workspace, setWorkspace] =
    useState<WorkspaceContextValue['workspace']>(null)
  const [member, setMember] =
    useState<WorkspaceMember | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkspace = useCallback(async () => {
    if (!user) {
      return { workspace: null, member: null }
    }

    const userWorkspace = await initializeDefaultWorkspace(
      user.uid,
      user,
    )

    if (!userWorkspace) {
      return { workspace: null, member: null }
    }

    const [latestWorkspace, workspaceMember] = await Promise.all([
      getWorkspace(userWorkspace.id),
      getWorkspaceMember(userWorkspace.id, user.uid),
    ])

    if (!workspaceMember || workspaceMember.status !== 'active') {
      return {
        workspace: latestWorkspace ?? userWorkspace,
        member: workspaceMember,
      }
    }

    return {
      workspace: latestWorkspace ?? userWorkspace,
      member: workspaceMember,
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function initializeWorkspace() {
      if (authLoading) {
        return
      }

      if (!user) {
        if (!cancelled) {
          setWorkspace(null)
          setMember(null)
          setLoading(false)
        }
        return
      }

      try {
        const loaded = await loadWorkspace()

        if (!cancelled) {
          setWorkspace(loaded.workspace)
          setMember(loaded.member)
        }
      } catch (error) {
        console.error('Failed to load workspace:', error)
        if (!cancelled) {
          setWorkspace(null)
          setMember(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void initializeWorkspace()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, loadWorkspace])

  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      setWorkspace(null)
      setMember(null)
      return
    }

    try {
      setLoading(true)
      const loaded = await loadWorkspace()
      setWorkspace(loaded.workspace)
      setMember(loaded.member)
    } catch (error) {
      console.error('Failed to refresh workspace:', error)
    } finally {
      setLoading(false)
    }
  }, [user, loadWorkspace])

  const hasWorkspaceAccess =
    Boolean(workspace && member?.status === 'active')

  const hasPermission = useCallback(
    (permission: Parameters<typeof roleHasPermission>[1]) => {
      if (!member || member.status !== 'active') {
        return false
      }

      return roleHasPermission(member.role, permission)
    },
    [member],
  )

  const value: WorkspaceContextValue = {
    workspace,
    member,
    loading: authLoading || loading,
    hasWorkspaceAccess,
    hasPermission,
    refreshWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { WorkspaceContext, type WorkspaceContextValue } from './WorkspaceContext'
import { getWorkspace, getWorkspaceMember, initializeDefaultWorkspace, subscribeToWorkspace, subscribeToWorkspaceMember } from '../services/workspaceService'
import { memberHasPermission } from '../types/permissions'
import type { WorkspaceMember } from '../types/workspace'

type WorkspaceProviderProps = { children: ReactNode }

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceContextValue['workspace']>(null)
  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkspace = useCallback(async () => {
    if (!user) return { workspace: null, member: null }

    const userWorkspace = await initializeDefaultWorkspace(user.uid, user)
    if (!userWorkspace) return { workspace: null, member: null }

    const [latestWorkspace, workspaceMember] = await Promise.all([
      getWorkspace(userWorkspace.id),
      getWorkspaceMember(userWorkspace.id, user.uid),
    ])

    return {
      workspace: latestWorkspace ?? userWorkspace,
      member: workspaceMember,
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function initializeWorkspace() {
      if (authLoading) return

      if (!user) {
        if (!cancelled) {
          setWorkspace(null)
          setMember(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
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
        if (!cancelled) setLoading(false)
      }
    }

    void initializeWorkspace()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, loadWorkspace])

  // Workspace branding is intentionally subscribed independently from membership.
  // This keeps portal-name changes live without causing the provider to re-subscribe
  // every time the member document changes.
  useEffect(() => {
    const workspaceId = workspace?.id
    if (!workspaceId) return undefined

    return subscribeToWorkspace(
      workspaceId,
      (nextWorkspace) => {
        setWorkspace(nextWorkspace)
      },
      (error) => console.error('Workspace listener failed:', error),
    )
  }, [workspace?.id])

  useEffect(() => {
    const workspaceId = workspace?.id
    const userId = user?.uid
    if (!workspaceId || !userId) return undefined

    return subscribeToWorkspaceMember(
      workspaceId,
      userId,
      (nextMember) => {
        setMember(nextMember)
      },
      (error) => console.error('Workspace membership listener failed:', error),
    )
  }, [workspace?.id, user?.uid])

  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      setWorkspace(null)
      setMember(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const loaded = await loadWorkspace()
      setWorkspace(loaded.workspace)
      setMember(loaded.member)
    } catch (error) {
      console.error('Failed to refresh workspace:', error)
    } finally {
      setLoading(false)
    }
  }, [user, loadWorkspace])

  const hasWorkspaceAccess = Boolean(workspace && member?.status === 'active')
  const hasPermission = useCallback(
    (permission: Parameters<typeof memberHasPermission>[1]) => memberHasPermission(member, permission),
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

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

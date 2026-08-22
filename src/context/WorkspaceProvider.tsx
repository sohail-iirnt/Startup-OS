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
  initializeDefaultWorkspace,
  getWorkspace,
} from '../services/workspaceService'

type WorkspaceProviderProps = {
  children: ReactNode
}

export function WorkspaceProvider({
  children,
}: WorkspaceProviderProps) {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [workspace, setWorkspace] =
    useState<WorkspaceContextValue['workspace']>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const loadWorkspace =
    useCallback(async () => {
      if (!user) {
        return null
      }

      const userWorkspace =
        await initializeDefaultWorkspace(
          user.uid,
        )

      const latestWorkspace =
        await getWorkspace(
          userWorkspace.id,
        )

      return (
        latestWorkspace ??
        userWorkspace
      )
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
          setLoading(false)
        }

        return
      }

      try {
        const loadedWorkspace =
          await loadWorkspace()

        if (!cancelled) {
          setWorkspace(
            loadedWorkspace,
          )
        }
      } catch (error) {
        console.error(
          'Failed to load workspace:',
          error,
        )

        if (!cancelled) {
          setWorkspace(null)
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
  }, [
    authLoading,
    user,
    loadWorkspace,
  ])

  const refreshWorkspace =
    useCallback(async () => {
      if (!user) {
        setWorkspace(null)
        return
      }

      try {
        setLoading(true)

        const loadedWorkspace =
          await loadWorkspace()

        setWorkspace(
          loadedWorkspace,
        )
      } catch (error) {
        console.error(
          'Failed to refresh workspace:',
          error,
        )
      } finally {
        setLoading(false)
      }
    }, [user, loadWorkspace])

  const value: WorkspaceContextValue = {
    workspace,
    loading:
      authLoading || loading,
    refreshWorkspace,
  }

  return (
    <WorkspaceContext.Provider
      value={value}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
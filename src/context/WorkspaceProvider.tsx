import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { WorkspaceContext, type WorkspaceContextValue } from './WorkspaceContext'
import { getWorkspace, getWorkspaceMember, initializeDefaultWorkspace, subscribeToWorkspace, subscribeToWorkspaceMember } from '../services/workspaceService'
import { memberHasPermission, normalizeUserRole } from '../types/permissions'
import type { WorkspaceMember } from '../types/workspace'

type WorkspaceProviderProps = { children: ReactNode }

function normalizeLiveMember(workspace: WorkspaceContextValue['workspace'], member: WorkspaceMember | null, userId: string): WorkspaceMember | null {
  if (!workspace || !member) return member
  const role = normalizeUserRole(member.role)
  if (workspace.ownerId === userId || role === 'owner') return { ...member, role: 'owner', status: 'active' }
  if (role === 'admin') return { ...member, role: 'admin', status: member.status === 'pending' ? 'active' : member.status }
  return member
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.uid
  const [workspace, setWorkspace] = useState<WorkspaceContextValue['workspace']>(null)
  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkspace = useCallback(async () => {
    if (!user || !userId) return { workspace: null, member: null }
    const userWorkspace = await initializeDefaultWorkspace(userId, user)
    if (!userWorkspace) return { workspace: null, member: null }
    const [latestWorkspace, workspaceMember] = await Promise.all([
      getWorkspace(userWorkspace.id),
      getWorkspaceMember(userWorkspace.id, userId),
    ])
    const resolvedWorkspace = latestWorkspace ?? userWorkspace
    return { workspace: resolvedWorkspace, member: normalizeLiveMember(resolvedWorkspace, workspaceMember, userId) }
  }, [user, userId])

  useEffect(() => {
    let cancelled = false
    async function initializeWorkspace() {
      if (authLoading) return
      if (!user || !userId) {
        if (!cancelled) { setWorkspace(null); setMember(null); setLoading(false) }
        return
      }
      setLoading(true)
      try {
        const loaded = await loadWorkspace()
        if (!cancelled) { setWorkspace(loaded.workspace); setMember(loaded.member) }
      } catch (error) {
        console.error('Failed to load workspace:', error)
        if (!cancelled) { setWorkspace(null); setMember(null) }
      } finally { if (!cancelled) setLoading(false) }
    }
    void initializeWorkspace()
    return () => { cancelled = true }
  }, [authLoading, user, userId, loadWorkspace])

  useEffect(() => {
    const workspaceId = workspace?.id
    if (!workspaceId) return undefined
    return subscribeToWorkspace(workspaceId, nextWorkspace => setWorkspace(nextWorkspace), error => console.error('Workspace listener failed:', error))
  }, [workspace?.id])

  useEffect(() => {
    const workspaceId = workspace?.id
    if (!workspaceId || !userId) return undefined
    return subscribeToWorkspaceMember(workspaceId, userId, nextMember => setMember(normalizeLiveMember(workspace, nextMember, userId)), error => console.error('Workspace membership listener failed:', error))
  }, [workspace, userId])

  const refreshWorkspace = useCallback(async () => {
    if (!user || !userId) { setWorkspace(null); setMember(null); setLoading(false); return }
    setLoading(true)
    try {
      const loaded = await loadWorkspace()
      setWorkspace(loaded.workspace); setMember(loaded.member)
    } catch (error) { console.error('Failed to refresh workspace:', error) }
    finally { setLoading(false) }
  }, [user, userId, loadWorkspace])

  const hasWorkspaceAccess = Boolean(workspace && member?.status === 'active')
  const ownerId = workspace?.ownerId
  const isOwner = Boolean(userId && ownerId && ownerId === userId)
  const isWorkspaceAdmin = isOwner || Boolean(member?.status === 'active' && normalizeUserRole(member.role) === 'admin')
  const hasPermission = useCallback((permission: Parameters<typeof memberHasPermission>[1]) => {
    if (isWorkspaceAdmin) return true
    return memberHasPermission(member, permission)
  }, [isWorkspaceAdmin, member])

  const value: WorkspaceContextValue = { workspace, member, loading: authLoading || loading, workspaceLoading: authLoading || loading, hasWorkspaceAccess, hasPermission, refreshWorkspace }
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { normalizeUserRole } from '../types/permissions'
import type { WorkspacePermission } from '../types/permissions'

type ProtectedRouteProps = {
  allowPendingApproval?: boolean
  requiredPermission?: WorkspacePermission
}

function ProtectedRoute({
  allowPendingApproval = false,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const {
    loading: workspaceLoading,
    hasWorkspaceAccess,
    hasPermission,
    member,
  } = useWorkspace()
  const location = useLocation()

  if (authLoading || workspaceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--os-bg)] px-6">
        <p className="text-sm text-[var(--os-text-secondary)]">Loading Startup OS...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (allowPendingApproval) {
    if (hasWorkspaceAccess) {
      return <Navigate to="/" replace />
    }

    return <Outlet />
  }

  if (!hasWorkspaceAccess) {
    if (
      member?.status === 'rejected' ||
      member?.status === 'suspended' ||
      member?.status === 'pending'
    ) {
      return <Navigate to="/pending-approval" replace />
    }

    return <Navigate to="/pending-approval" replace />
  }

  // Owner/admin are workspace administrators. Their administrator baseline
  // must never be blocked by a stale/mismatched page-level permission check.
  // Data-level access is still enforced by Firestore rules.
  const role = normalizeUserRole(member?.role)
  const isWorkspaceAdmin = role === 'owner' || role === 'admin'

  if (requiredPermission && !isWorkspaceAdmin && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
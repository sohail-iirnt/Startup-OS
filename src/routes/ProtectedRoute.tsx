import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../context/useAuth'

function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <div>
        <p>Loading Startup OS...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '../hooks/useAuth'
import { LoadingBlock } from './Spinner'
import type { Role } from '../types'

/**
 * Gate for a specific role. Unauthenticated users go to /login; authenticated
 * users lacking the role are sent home (they are logged in, just not allowed).
 */
export function RequireRole({ role }: { role: Role }) {
  const { user, isLoading } = useMe()
  const location = useLocation()

  if (isLoading) return <LoadingBlock label="Checking your session…" />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user.role !== role) return <Navigate to="/" replace />
  return <Outlet />
}

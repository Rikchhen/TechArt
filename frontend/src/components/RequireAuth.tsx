import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '../hooks/useAuth'
import { LoadingBlock } from './Spinner'

/** Gate for any authenticated customer. Redirects to /login, preserving intent. */
export function RequireAuth() {
  const { user, isLoading } = useMe()
  const location = useLocation()

  if (isLoading) return <LoadingBlock label="Checking your session…" />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

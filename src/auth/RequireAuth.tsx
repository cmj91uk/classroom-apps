import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './authContext'
import { AppHeader } from '../components/AppHeader'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <>
        <AppHeader
          title="Classroom apps"
          subtitle="Checking your sign-in…"
          showAuthActions={false}
        />
        <p className="text-base text-muted">Checking your sign-in…</p>
      </>
    )
  }

  if (!session) {
    const next = `${location.pathname}${location.search}${location.hash}`
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(next)}`}
        replace
      />
    )
  }

  return <Outlet />
}

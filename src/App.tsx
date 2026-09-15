import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { refreshUserback } from './lib/userback'

export function App() {
  const location = useLocation()

  useEffect(() => {
    refreshUserback()
  }, [location.pathname, location.search])

  return <Outlet />
}

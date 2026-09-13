import { Outlet } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'

export function App() {
  return (
    <AuthProvider>
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-10 sm:px-6">
        <Outlet />
      </div>
    </AuthProvider>
  )
}

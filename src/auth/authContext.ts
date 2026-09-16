import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type PasswordResult = {
  error: Error | null
  needsConfirmation: boolean
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithGoogle: (next?: string) => Promise<void>
  signInWithMicrosoft: (next?: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<PasswordResult>
  signInWithMagicLink: (email: string, next?: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

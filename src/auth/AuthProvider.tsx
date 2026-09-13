import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { appUrl, safeNextPath } from '../lib/appUrl'
import { supabase } from '../lib/supabase'
import {
  AuthContext,
  type AuthContextValue,
  type PasswordResult,
} from './authContext'

async function signInWithProvider(
  provider: 'google' | 'azure',
  next?: string,
) {
  const redirectTo = appUrl(
    `auth/callback?next=${encodeURIComponent(safeNextPath(next))}`,
  )
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: provider === 'azure' ? 'email' : undefined,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback((next?: string) => {
    return signInWithProvider('google', next)
  }, [])

  const signInWithMicrosoft = useCallback((next?: string) => {
    return signInWithProvider('azure', next)
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUpWithPassword = useCallback(
    async (email: string, password: string): Promise<PasswordResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: appUrl('auth/confirm'),
        },
      })
      if (error) return { error, needsConfirmation: false }
      return { error: null, needsConfirmation: !data.session }
    },
    [],
  )

  const signInWithMagicLink = useCallback(async (email: string, next?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: appUrl(
          `auth/confirm?next=${encodeURIComponent(safeNextPath(next))}`,
        ),
      },
    })
    if (error) throw error
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl('reset-password'),
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithGoogle,
      signInWithMicrosoft,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      sendPasswordReset,
      updatePassword,
      signOut,
    }),
    [
      session,
      loading,
      signInWithGoogle,
      signInWithMicrosoft,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      sendPasswordReset,
      updatePassword,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

const OTP_TYPES: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && OTP_TYPES.includes(value as EmailOtpType)
}

function readParam(url: URL, key: string): string | null {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
  return url.searchParams.get(key) ?? hashParams.get(key)
}

export type AuthRedirectResult = {
  error: string | null
  recovery: boolean
}

export async function completeAuthFromUrl(
  url: URL = new URL(window.location.href),
): Promise<AuthRedirectResult> {
  const error = readParam(url, 'error_description') ?? readParam(url, 'error')
  if (error) {
    return {
      error: decodeURIComponent(error.replace(/\+/g, ' ')),
      recovery: false,
    }
  }

  const tokenHash = readParam(url, 'token_hash')
  const typeParam = readParam(url, 'type')

  if (tokenHash && isOtpType(typeParam)) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam,
    })
    return {
      error: verifyError?.message ?? null,
      recovery: typeParam === 'recovery',
    }
  }

  const hasAuthParams = Boolean(
    readParam(url, 'code') || url.hash.includes('access_token'),
  )
  const { session, recovery } = await waitForSession(hasAuthParams ? 4000 : 0)

  if (session) {
    return { error: null, recovery }
  }

  return {
    error: hasAuthParams
      ? 'Could not complete sign-in. Please try again.'
      : 'Missing sign-in details in this link.',
    recovery: false,
  }
}

function waitForSession(
  timeoutMs: number,
): Promise<{ session: Session | null; recovery: boolean }> {
  return new Promise((resolve) => {
    let settled = false
    let recovery = false
    let timer = 0
    let unsubscribe = () => {}

    const finish = (session: Session | null) => {
      if (settled) return
      settled = true
      unsubscribe()
      window.clearTimeout(timer)
      resolve({ session, recovery })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') recovery = true
      if (session) finish(session)
    })
    unsubscribe = () => subscription.unsubscribe()

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session)
      else if (timeoutMs === 0) finish(null)
    })

    if (timeoutMs > 0) {
      timer = window.setTimeout(() => {
        void supabase.auth.getSession().then(({ data }) => finish(data.session))
      }, timeoutMs)
    }
  })
}

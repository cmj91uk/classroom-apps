import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { authErrorMessage } from '../lib/authErrors'
import { completeAuthFromUrl } from '../lib/completeAuthFromUrl'
import { safeNextPath } from '../lib/appUrl'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../useDocumentTitle'

export function AuthCallbackPage() {
  useDocumentTitle('Signing in')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const result = await completeAuthFromUrl()
      if (cancelled) return

      if (result.error) {
        setError(authErrorMessage(result.error))
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Could not complete sign-in. Please try again.')
        return
      }

      if (result.recovery) {
        navigate('/reset-password', { replace: true })
        return
      }

      navigate(safeNextPath(searchParams.get('next')), { replace: true })
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <>
      <AppHeader
        title="Signing you in"
        subtitle={
          error
            ? 'We could not finish signing you in.'
            : 'Just a moment while we complete sign-in.'
        }
        showAuthActions={false}
      />
      {error ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="w-fit rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <p className="text-base text-muted">Signing you in…</p>
      )}
    </>
  )
}

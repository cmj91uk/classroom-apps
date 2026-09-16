import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { AppHeader } from '../components/AppHeader'
import { authErrorMessage } from '../lib/authErrors'
import { completeAuthFromUrl } from '../lib/completeAuthFromUrl'
import { useDocumentTitle } from '../useDocumentTitle'

const inputClass =
  'w-full rounded-lg border border-beige-dark/40 bg-white px-4 py-3 text-base text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

export function ResetPasswordPage() {
  useDocumentTitle('Choose a new password')
  const { session, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const passwordId = useId()
  const confirmId = useId()
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function prepare() {
      const url = new URL(window.location.href)
      const hasAuthParams =
        url.searchParams.has('code') ||
        url.searchParams.has('token_hash') ||
        url.hash.includes('access_token')

      if (hasAuthParams) {
        const result = await completeAuthFromUrl(url)
        if (cancelled) return
        if (result.error) {
          setLinkError(authErrorMessage(result.error))
          setReady(true)
          return
        }
      }

      setReady(true)
    }

    void prepare()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Those passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await updatePassword(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const canReset = ready && !loading && Boolean(session) && !linkError

  return (
    <>
      <AppHeader
        title="Choose a new password"
        subtitle={
          canReset
            ? 'Enter a new password for your classroom apps account.'
            : 'This reset link is invalid or has expired.'
        }
        showAuthActions={Boolean(session)}
      />

      {!ready || loading ? (
        <p className="text-base text-muted">Checking your reset link…</p>
      ) : canReset ? (
        <form className="flex max-w-md flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
          <div className="flex flex-col gap-2">
            <label htmlFor={passwordId} className="text-sm font-medium text-ink">
              New password
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={confirmId} className="text-sm font-medium text-ink">
              Confirm password
            </label>
            <input
              id={confirmId}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Update password'}
          </button>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-700" role="alert">
            {linkError ?? 'Request a new reset link from the sign-in page.'}
          </p>
          <button
            type="button"
            className="w-fit rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to sign in
          </button>
        </div>
      )}
    </>
  )
}

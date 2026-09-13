import { useId, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/authContext'
import { AppHeader } from '../components/AppHeader'
import { authErrorMessage } from '../lib/authErrors'
import { safeNextPath } from '../lib/appUrl'
import { useDocumentTitle } from '../useDocumentTitle'

const inputClass =
  'w-full rounded-lg border border-beige-dark/40 bg-white px-4 py-3 text-base text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

const secondaryButtonClass =
  'inline-flex w-full items-center justify-center gap-3 rounded-lg border border-beige-dark/40 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-beige/40 disabled:cursor-not-allowed disabled:opacity-40'

const primaryButtonClass =
  'w-full rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40'

type Mode = 'sign-in' | 'create-account' | 'forgot'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.12 2.77-2.39 3.63v3.02h3.87c2.26-2.08 3.55-5.14 3.55-8.68"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3.02c-1.08.72-2.47 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.26v3.11C3.24 21.3 7.31 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.25A7.2 7.2 0 0 1 4.88 12c0-.78.13-1.54.37-2.25V6.64H1.26A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.26 5.36z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.36.61 4.61 1.8l3.46-3.46C17.95 1.14 15.24 0 12 0 7.31 0 3.24 2.7 1.26 6.64l3.99 3.11C6.2 6.87 8.86 4.75 12 4.75"
      />
    </svg>
  )
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  )
}

export function LoginPage() {
  useDocumentTitle('Sign in')
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    sendPasswordReset,
  } = useAuth()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))

  const emailId = useId()
  const passwordId = useId()
  const confirmId = useId()

  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState<'google' | 'microsoft' | 'email' | 'magic' | 'reset' | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (!loading && user) {
    return <Navigate to={next} replace />
  }

  async function onSocial(provider: 'google' | 'microsoft') {
    setError(null)
    setInfo(null)
    setBusy(provider)
    try {
      if (provider === 'google') await signInWithGoogle(next)
      else await signInWithMicrosoft(next)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(null)
    }
  }

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (mode === 'create-account' && password !== confirmPassword) {
      setError('Those passwords do not match.')
      return
    }

    setBusy('email')
    try {
      if (mode === 'create-account') {
        const result = await signUpWithPassword(email.trim(), password)
        if (result.error) throw result.error
        if (result.needsConfirmation) {
          setInfo('Check your email to confirm your account, then sign in.')
        }
      } else {
        await signInWithPassword(email.trim(), password)
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function onMagicLink() {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('Enter your email address to receive a sign-in link.')
      return
    }
    setBusy('magic')
    try {
      await signInWithMagicLink(email.trim(), next)
      setInfo('Check your email for a sign-in link.')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function onReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setBusy('reset')
    try {
      await sendPasswordReset(email.trim())
      setInfo('Check your email for a password reset link.')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const submitting = busy !== null

  return (
    <>
      <AppHeader
        eyebrow="Classroom tools"
        title="Sign in"
        subtitle="Use Google, Microsoft, or email to open the classroom apps."
        showAuthActions={false}
      />

      <main className="flex flex-1 flex-col gap-8">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={submitting}
            onClick={() => void onSocial('google')}
          >
            <GoogleMark />
            {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={submitting}
            onClick={() => void onSocial('microsoft')}
          >
            <MicrosoftMark />
            {busy === 'microsoft' ? 'Redirecting…' : 'Continue with Microsoft'}
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-px flex-1 bg-beige-dark/40" />
          or use email
          <span className="h-px flex-1 bg-beige-dark/40" />
        </div>

        {mode === 'forgot' ? (
          <form className="flex flex-col gap-4" onSubmit={(event) => void onReset(event)}>
            <div className="flex flex-col gap-2">
              <label htmlFor={emailId} className="text-sm font-medium text-ink">
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {busy === 'reset' ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              className="text-sm font-medium text-muted transition hover:text-ink"
              onClick={() => {
                setMode('sign-in')
                setError(null)
                setInfo(null)
              }}
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => void onPassword(event)}>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={mode === 'sign-in'}
                className={[
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                  mode === 'sign-in'
                    ? 'bg-ink text-white'
                    : 'text-muted hover:bg-beige/50 hover:text-ink',
                ].join(' ')}
                onClick={() => {
                  setMode('sign-in')
                  setError(null)
                  setInfo(null)
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={mode === 'create-account'}
                className={[
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                  mode === 'create-account'
                    ? 'bg-ink text-white'
                    : 'text-muted hover:bg-beige/50 hover:text-ink',
                ].join(' ')}
                onClick={() => {
                  setMode('create-account')
                  setError(null)
                  setInfo(null)
                }}
              >
                Create account
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={emailId} className="text-sm font-medium text-ink">
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={passwordId} className="text-sm font-medium text-ink">
                Password
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete={mode === 'create-account' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </div>

            {mode === 'create-account' ? (
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
            ) : null}

            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {busy === 'email'
                ? mode === 'create-account'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'create-account'
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            {mode === 'sign-in' ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={submitting}
                  className="text-left text-sm font-medium text-muted transition hover:text-ink"
                  onClick={() => void onMagicLink()}
                >
                  {busy === 'magic' ? 'Sending link…' : 'Email me a sign-in link'}
                </button>
                <button
                  type="button"
                  className="text-left text-sm font-medium text-muted transition hover:text-ink"
                  onClick={() => {
                    setMode('forgot')
                    setError(null)
                    setInfo(null)
                    setPassword('')
                  }}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}
          </form>
        )}

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="text-sm text-muted" role="status">
            {info}
          </p>
        ) : null}
      </main>
    </>
  )
}

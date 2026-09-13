import { Link, useLocation } from 'react-router'
import { useAuth } from '../auth/authContext'
import { authErrorMessage } from '../lib/authErrors'

type AppHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  backToApps?: boolean
  showAuthActions?: boolean
}

function displayName(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return ''
  const metadata = user.user_metadata
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user.email
  return name ?? 'Signed in'
}

export function AppHeader({
  title,
  subtitle,
  eyebrow,
  backToApps = false,
  showAuthActions = true,
}: AppHeaderProps) {
  const { user, loading, signOut } = useAuth()
  const location = useLocation()

  async function handleSignOut() {
    try {
      await signOut()
    } catch (error) {
      window.alert(authErrorMessage(error))
    }
  }

  const homeTo = user ? '/' : `/login?next=${encodeURIComponent(location.pathname)}`

  return (
    <header className="mb-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={homeTo}
          className="text-sm font-medium tracking-wide text-muted uppercase transition hover:text-ink"
        >
          Classroom apps
        </Link>
        {showAuthActions && !loading ? (
          user ? (
            <div className="flex items-center gap-3">
              <p className="max-w-48 truncate text-sm text-muted" title={displayName(user)}>
                {displayName(user)}
              </p>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-lg border border-beige-dark/40 bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-beige/40"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to={`/login?next=${encodeURIComponent(location.pathname === '/login' ? '/' : location.pathname)}`}
              className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Sign in
            </Link>
          )
        ) : null}
      </div>
      {backToApps ? (
        <Link
          to="/"
          className="mb-4 inline-block text-sm font-medium text-muted transition hover:text-ink"
        >
          ← All apps
        </Link>
      ) : null}
      {eyebrow ? (
        <p className="mb-2 text-sm font-medium tracking-wide text-muted uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-xl text-base text-muted">{subtitle}</p>
      ) : null}
    </header>
  )
}

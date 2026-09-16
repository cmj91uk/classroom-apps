import { Link } from 'react-router'
import { MINI_APPS } from '../apps/catalog'
import { AppHeader } from '../components/AppHeader'
import { useDocumentTitle } from '../useDocumentTitle'

export function LandingPage() {
  useDocumentTitle('Classroom apps')

  return (
    <>
      <AppHeader
        eyebrow="Classroom tools"
        title="Mini apps for displays and printables"
        subtitle="Pick an app to get started. More classroom tools will land here over time."
      />

      <main>
        <ul className="grid gap-4 sm:grid-cols-2">
          {MINI_APPS.map((app) => (
            <li key={app.id}>
              <Link
                to={app.path}
                className="flex h-full flex-col rounded-xl border border-beige-dark/40 bg-white p-5 shadow-sm transition hover:border-beige-dark hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-ink">{app.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted">
                  {app.description}
                </p>
                <span className="mt-4 text-sm font-medium text-ink">
                  Open app →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}

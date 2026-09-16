import { Link } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { useDocumentTitle } from '../useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="flex flex-1 flex-col justify-center">
      <AppHeader
        eyebrow="404"
        title="This page isn’t here"
        subtitle="That link doesn’t match any of the classroom apps."
      />
      <Link
        to="/"
        className="mt-2 w-fit rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
      >
        Back to all apps
      </Link>
    </div>
  )
}

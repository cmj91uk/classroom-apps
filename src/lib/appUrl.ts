const AUTH_PATHS = ['/login', '/auth/callback', '/auth/confirm', '/reset-password']

export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  const normalised = path.replace(/^\//, '')
  return new URL(normalised, `${window.location.origin}${base}`).href
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return '/'
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return '/'
  if (trimmed.startsWith('//') || trimmed.includes('\\') || trimmed.includes('://')) {
    return '/'
  }

  const pathname = trimmed.split(/[?#]/, 1)[0] ?? trimmed
  if (AUTH_PATHS.includes(pathname)) return '/'
  return trimmed
}

const MESSAGES: Record<string, string> = {
  'invalid login credentials': 'That email or password is not correct.',
  'email not confirmed':
    'Check your email to confirm your account before signing in.',
  'user already registered':
    'An account with that email already exists. Try signing in.',
  'signup is disabled': 'New accounts cannot be created at the moment.',
  'over_email_send_rate_limit':
    'Please wait a moment before requesting another email.',
  'for security purposes, you can only request this after':
    'Please wait a moment before requesting another email.',
  'password should be at least': 'Use at least 6 characters for your password.',
  'unable to validate email address': 'Enter a valid email address.',
  'provider is not enabled':
    'That sign-in method is not enabled yet. Use email, or finish provider setup in Supabase.',
  'unsupported provider':
    'That sign-in method is not enabled yet. Use email, or finish provider setup in Supabase.',
  'same password': 'Choose a password that is different from your current one.',
  'new password should be different':
    'Choose a password that is different from your current one.',
}

export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Something went wrong. Please try again.'
  const normalised = raw.toLowerCase()

  for (const [needle, message] of Object.entries(MESSAGES)) {
    if (normalised.includes(needle)) return message
  }

  return raw
}

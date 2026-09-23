/**
 * Inserts a keep-alive heartbeat into Supabase so free-tier projects are
 * not paused for inactivity. Adapted from travisvn/supabase-inactive-fix
 * to write CheckTimeUtc (current UTC datetime) plus a random UUID.
 *
 * Required env:
 *   SUPABASE_URL       e.g. https://<project-ref>.supabase.co
 *   SUPABASE_ANON_KEY  publishable/anon key (GitHub Actions secret)
 */
const TABLE_NAME = 'keep-alive'
const MAX_ROWS = 10

const DEFAULT_SUPABASE_URL = 'https://vzqhefuugsavimuvmnwg.supabase.co'

const supabaseUrl = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(
  /\/$/,
  '',
)
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error(
    'Missing SUPABASE_ANON_KEY. Add it as a GitHub Actions repository secret.',
  )
  process.exit(1)
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
}

function restUrl(pathAndQuery) {
  return `${supabaseUrl}/rest/v1/${pathAndQuery}`
}

async function fetchWithRetry(url, options, { attempts = 6, label = 'Request' } = {}) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options)
      const transient = response.status === 503 || response.status === 504 || response.status === 546

      if (transient && attempt < attempts) {
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 15000)
        console.log(
          `${label} returned ${response.status}. Retrying in ${delayMs}ms (${attempt}/${attempts})...`,
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      return response
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 15000)
        console.log(
          `${label} failed (${error.message}). Retrying in ${delayMs}ms (${attempt}/${attempts})...`,
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }
    }
  }

  throw lastError ?? new Error(`${label} failed after ${attempts} attempts.`)
}

async function insertHeartbeat() {
  const payload = {
    CheckTimeUtc: new Date().toISOString(),
    random: crypto.randomUUID(),
  }

  const response = await fetchWithRetry(
    restUrl(TABLE_NAME),
    {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    },
    { label: 'Insert' },
  )

  if (!response.ok) {
    throw new Error(
      `Insert failed (${response.status}): ${await response.text()}`,
    )
  }

  const rows = await response.json()
  console.log(`Inserted keep-alive row: ${JSON.stringify(rows)}`)
}

async function getRowCount() {
  const response = await fetchWithRetry(
    restUrl(`${TABLE_NAME}?select=id`),
    {
      headers: {
        ...headers,
        Prefer: 'count=exact',
      },
    },
    { label: 'Count' },
  )

  if (!response.ok) {
    throw new Error(
      `Count failed (${response.status}): ${await response.text()}`,
    )
  }

  const contentRange = response.headers.get('content-range')
  const countFromHeader = contentRange?.split('/')[1]
  const count = countFromHeader === '*' ? (await response.json()).length : Number(countFromHeader)

  if (!Number.isFinite(count)) {
    throw new Error(`Could not parse row count from content-range: ${contentRange}`)
  }

  return count
}

async function deleteRandomEntry() {
  const response = await fetchWithRetry(
    restUrl(`${TABLE_NAME}?select=id`),
    { headers },
    { label: 'Select ids' },
  )

  if (!response.ok) {
    throw new Error(
      `Select ids failed (${response.status}): ${await response.text()}`,
    )
  }

  const rows = await response.json()
  const ids = rows.map((row) => row.id).filter((id) => id != null)

  if (ids.length === 0) {
    console.log('No keep-alive rows to delete.')
    return
  }

  const randomId = ids[Math.floor(Math.random() * ids.length)]
  const deleteResponse = await fetchWithRetry(
    restUrl(`${TABLE_NAME}?id=eq.${randomId}`),
    {
      method: 'DELETE',
      headers,
    },
    { label: 'Delete' },
  )

  if (!deleteResponse.ok) {
    throw new Error(
      `Delete failed (${deleteResponse.status}): ${await deleteResponse.text()}`,
    )
  }

  console.log(`Deleted keep-alive row id ${randomId}.`)
}

const inserted = await insertHeartbeat()
  .then(() => true)
  .catch((error) => {
    console.error(error.message)
    return false
  })

if (!inserted) {
  process.exit(1)
}

let count
try {
  count = await getRowCount()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

console.log(`Current number of entries in '${TABLE_NAME}': ${count}`)

if (count > MAX_ROWS) {
  console.log(`Table '${TABLE_NAME}' has more than ${MAX_ROWS} entries. Deleting a random entry.`)
  try {
    await deleteRandomEntry()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
} else {
  console.log(`Table '${TABLE_NAME}' has ${MAX_ROWS} or fewer entries. No deletion needed.`)
}

console.log('Keep-alive check succeeded.')

// Serveronet Site API client.
//
// The built SPA is served by the Serveronet client at http://<site_id>.snet.localhost:15080/
// The client sets `site_root` and `site_id` cookies when serving site files.
// Database records are read through the same-origin Site API backend.
//
// The Site API can be slow, so this client supports request cancellation,
// retries after CSRF/session expiry (HTTP 419), and a short-lived success
// cache to avoid repeat round-trips while browsing (SPA navigation).

function getCookieValueByName(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

export function siteRoot() {
  return getCookieValueByName('site_root') || (window.location.origin + '/')
}

let csrfReady = null

async function fetchCsrfCookie() {
  const response = await fetch(siteRoot() + 'site_api/v1/csrf-cookie', {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!response.ok && !getCookieValueByName('XSRF-TOKEN')) {
    throw new QueryError('CSRF token request failed with status ' + response.status)
  }
}

export function ensureCsrf() {
  if (!csrfReady) {
    csrfReady = fetchCsrfCookie().catch((e) => {
      // Let the next call try again instead of poisoning every request.
      csrfReady = null
      throw e
    })
  }
  return csrfReady
}

export function refreshCsrf() {
  csrfReady = null
  return ensureCsrf()
}

function csrfHeader() {
  return getCookieValueByName('XSRF-TOKEN')
}

export class QueryError extends Error {
  constructor(message, payload) {
    super(message)
    this.payload = payload
  }
}

// Site API failures come back as HTTP 200 with { success: false, message }.
// Surface the actual backend message (e.g. "No peers to handle the query"),
// limited to 40 characters.
const MESSAGE_MAX_CHARS = 40

function truncateMessage(text) {
  const t = String(text).trim()
  if (t.length <= MESSAGE_MAX_CHARS) return t
  return t.slice(0, MESSAGE_MAX_CHARS - 1).trimEnd() + '…'
}

function failureMessageFrom(json) {
  if (!json || typeof json !== 'object') return null
  for (const candidate of [json.message, json.error, json.data]) {
    if (typeof candidate === 'string' && candidate.trim()) return truncateMessage(candidate)
  }
  return null
}

// Non-OK responses may still carry a JSON error body (throttle/403 etc.).
async function readFailureMessage(response) {
  try {
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('json')) return null
    return failureMessageFrom(await response.json())
  } catch (e) {
    return null
  }
}

function abortError() {
  const e = new Error('Request aborted')
  e.name = 'AbortError'
  return e
}

// Parse rows returned by query_endpoint. Every record row is a separate
// database record; the original record body is kept in _sn_record_json.
function decodeRow(row) {
  let rec = null
  if (row && typeof row._sn_record_json === 'string') {
    try {
      rec = JSON.parse(row._sn_record_json)
    } catch (e) {
      rec = null
    }
  }
  return Object.assign({}, row, rec || {})
}

// Short-lived cache of successful responses keyed by request body. The
// category strip, table counts and repeated list queries otherwise pay a
// full round-trip on every navigation.
const CACHE_TTL_MS = 30 * 1000
const cache = new Map()

export function clearSiteCache() {
  cache.clear()
}

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value) {
  if (cache.size > 200) cache.clear()
  cache.set(key, { at: Date.now(), value })
}

/**
 * POST site_api/v1/query_endpoint
 *
 * queryParameters: { table, where?: [[col, op, val]], orWhere?: [[col, op, val]],
 *   whereNull?: col, whereNotNull?: col, whereIn?: [col, [values]],
 *   whereNotIn?: [col, [values]], orderBy?: [col, 'asc'|'desc'], limit?: n }
 *
 * options: { countOnly?: boolean, signal?: AbortSignal, noCache?: boolean }
 * returns { rows, count, sql }
 */
export async function querySiteDb(queryParameters, { countOnly = false, signal, noCache = false } = {}) {
  if (signal && signal.aborted) throw abortError()

  const body = { query_parameters: queryParameters }
  if (countOnly) body.count_only = true
  const key = JSON.stringify(body)

  if (!noCache) {
    const cached = cacheGet(key)
    if (cached) return Promise.resolve(cached)
  }

  await ensureCsrf()
  let result = await postQuery(body, key, signal, false)

  if (!noCache) cacheSet(key, result)
  return result
}

async function postQuery(body, key, signal, isRetry) {
  const response = await fetch(siteRoot() + 'site_api/v1/query_endpoint', {
    method: 'POST',
    credentials: 'same-origin',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-XSRF-TOKEN': csrfHeader() || '',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 419 && !isRetry) {
    // Session/CSRF mismatch (e.g. stale cookie): refresh once and retry.
    await refreshCsrf()
    return postQuery(body, key, signal, true)
  }

  if (!response.ok) {
    const backendMessage = await readFailureMessage(response)
    throw new QueryError(backendMessage || truncateMessage('Site API responded with status ' + response.status))
  }

  const json = await response.json()
  if (json.success !== true) {
    throw new QueryError(failureMessageFrom(json) || 'Query failed', json)
  }

  if (body.count_only) {
    return { count: json.data.records_count, rows: [], sql: json.sql_query || '' }
  }

  return {
    rows: (json.data || []).map(decodeRow),
    sql: json.sql_query || '',
  }
}

export async function countSiteTable(table, opts = {}) {
  const { count } = await querySiteDb({ table }, { ...opts, countOnly: true })
  return count
}

// Serveronet Site API client.
//
// The built SPA is served by the Serveronet client at http://<site_id>.snet.localhost:15080/
// The client sets `site_root` and `site_id` cookies when serving site files.
// Database records are read through the same-origin Site API backend.

function getCookieValueByName(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

export function siteRoot() {
  return getCookieValueByName('site_root') || (window.location.origin + '/')
}

let csrfReady = null

export function ensureCsrf() {
  if (!csrfReady) {
    csrfReady = (async () => {
      await fetch(siteRoot() + 'site_api/v1/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
      })
    })()
  }
  return csrfReady
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

/**
 * POST site_api/v1/query_endpoint
 *
 * queryParameters: { table, where?: [[col, op, val]], orWhere?: [[col, op, val]],
 *   whereNull?: col, whereNotNull?: col, whereIn?: [col, [values]],
 *   whereNotIn?: [col, [values]], orderBy?: [col, 'asc'|'desc'], limit?: n }
 *
 * returns { rows, count, sql }
 */
export async function querySiteDb(queryParameters, { countOnly = false } = {}) {
  await ensureCsrf()

  const body = { query_parameters: queryParameters }
  if (countOnly) body.count_only = true

  const response = await fetch(siteRoot() + 'site_api/v1/query_endpoint', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-XSRF-TOKEN': csrfHeader() || '',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new QueryError('Site API responded with status ' + response.status)
  }

  const json = await response.json()
  if (json.success !== true) {
    throw new QueryError(
      typeof json.data === 'string' ? json.data : 'Query failed',
      json
    )
  }

  if (countOnly) {
    return { count: json.data.records_count, rows: [], sql: json.sql_query || '' }
  }

  return {
    rows: (json.data || []).map(decodeRow),
    sql: json.sql_query || '',
  }
}

export async function countSiteTable(table) {
  const { count } = await querySiteDb({ table }, { countOnly: true })
  return count
}

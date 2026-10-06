import { useCallback, useEffect, useState } from 'react'
import { querySiteDb, countSiteTable } from '../api/siteApi.js'

// Runs a Site API query for the lifetime of a component. The API can be
// slow, so in-flight requests are aborted when parameters change or the
// component unmounts, and a `retry()` is exposed for error surfaces.
// On refetch, previously loaded rows are kept visible (stale-while-
// revalidate) so skeletons only appear for a cold first load.
export function useSiteQuery(queryParameters, deps = [], opts = {}) {
  const [state, setState] = useState({ loading: true, rows: [], sql: '', error: null })
  const [nonce, setNonce] = useState(0)
  const key = JSON.stringify(queryParameters)
  const { enabled = true } = opts

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    querySiteDb(JSON.parse(key), { signal: controller.signal })
      .then(({ rows, sql }) => {
        if (!cancelled) setState({ loading: false, rows, sql, error: null })
      })
      .catch((e) => {
        if (cancelled || (e && e.name === 'AbortError')) return
        setState((s) => ({ ...s, loading: false, error: e }))
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [key, enabled, nonce, ...deps])

  const retry = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, retry }
}

export function useTableCount(table, deps = []) {
  const [count, setCount] = useState(null)
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    countSiteTable(table, { signal: controller.signal })
      .then((c) => !cancelled && setCount(c))
      .catch((e) => {
        if (cancelled || (e && e.name === 'AbortError')) return
        setCount(0)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [table, ...deps])
  return count
}

import { useEffect, useState } from 'react'
import { querySiteDb, countSiteTable } from '../api/siteApi.js'

export function useSiteQuery(queryParameters, deps = [], opts = {}) {
  const [state, setState] = useState({ loading: true, rows: [], sql: '', error: null })
  const key = JSON.stringify(queryParameters)
  const { enabled = true } = opts

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    querySiteDb(JSON.parse(key))
      .then(({ rows, sql }) => {
        if (!cancelled) setState({ loading: false, rows, sql, error: null })
      })
      .catch((e) => {
        if (!cancelled) setState({ loading: false, rows: [], sql: '', error: e })
      })
    return () => {
      cancelled = true
    }
  }, [key, enabled, ...deps])

  return state
}

export function useTableCount(table, deps = []) {
  const [count, setCount] = useState(null)
  useEffect(() => {
    let cancelled = false
    countSiteTable(table)
      .then((c) => !cancelled && setCount(c))
      .catch(() => !cancelled && setCount(0))
    return () => {
      cancelled = true
    }
  }, [table, ...deps])
  return count
}

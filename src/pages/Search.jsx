import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { querySiteDb } from '../api/siteApi.js'
import { useSiteQuery } from '../hooks/useSiteQuery.js'
import { looksLikeSql, parseSqlQuery, toQueryParameters } from '../lib/sqlish.js'
import { parseJsonField } from '../lib/format.js'
import { SkeletonSearchResults, Spinner, SlowHint } from '../components/Skeleton.jsx'

const SQL_EXAMPLES = [
  "title like 'camera'",
  "title like 'flock' or short_description like 'flock'",
  "title like 'wiki' and published_date >= '2024-01-01' order by published_at desc limit 10",
  'author = \'Bonaventure\' limit 25',
  "description like '%ransomware%' order by published_date asc",
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => {
    const q = searchParams.get('query') || ''
    const type = searchParams.get('type') || ''
    const country = searchParams.get('country') || ''
    const source = searchParams.get('source') || ''
    const sort = searchParams.get('sort') || 'relevance'
    const after = searchParams.get('after') || ''
    const before = searchParams.get('before') || ''
    const mode = searchParams.get('mode') || ''
    return { q, type, country, source, sort, after, before, mode }
  }, [searchParams])

  const sqlMode = params.mode ? params.mode === 'sql' : looksLikeSql(params.q)
  const [state, setState] = useState({ loading: false, rows: [], sql: '', error: null, qp: null })
  const [nonce, setNonce] = useState(0)
  const retrySearch = () => setNonce((n) => n + 1)

  const countries = useSiteQuery({ table: 'categories', where: [['kind', '=', 'country']], orderBy: ['name', 'asc'], limit: 1000 })
  const sources = useSiteQuery({ table: 'categories', where: [['kind', '=', 'source']], orderBy: ['name', 'asc'], limit: 1000 })

  useEffect(() => {
    if (!params.q && !params.type && !params.country && !params.source) {
      setState({ loading: false, rows: [], sql: '', error: null, qp: null })
      return
    }
    const controller = new AbortController()
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        // 1) Build the articles query
        let qp
        if (sqlMode) {
          const parsed = parseSqlQuery(params.q)
          qp = toQueryParameters(parsed)
        } else {
          const like = '%' + params.q + '%'
          qp = {
            table: 'articles',
            ...(params.q ? {
              orWhere: [
                ['title', 'like', like],
                ['short_description', 'like', like],
                ['description', 'like', like],
                ['sources', 'like', like],
              ],
            } : {}),
          }
          const dir = params.sort === 'oldest' ? 'asc' : 'desc'
          qp.orderBy = params.sort === 'title' ? ['title', 'asc'] : ['published_at', dir]
          if (params.sort === 'relevance' || params.sort === 'newest') qp.orderBy = ['published_at', 'desc']
        }

        // 2) date ranges
        const extraWhere = [...(qp.where || [])]
        if (params.after) extraWhere.push(['published_date', '>=', params.after])
        if (params.before) extraWhere.push(['published_date', '<=', params.before])
        if (extraWhere.length) qp.where = extraWhere

        // 3) term filters: resolve to slugs via the article_terms relation table
        const termFilters = []
        if (params.type) termFilters.push(['type', params.type])
        if (params.country) termFilters.push(['country', params.country])
        if (params.source) termFilters.push(['source', params.source])
        if (termFilters.length) {
          const slugSets = await Promise.all(
            termFilters.map(([kind, term]) =>
              querySiteDb(
                {
                  table: 'article_terms',
                  where: [
                    ['kind', '=', kind],
                    ['term', '=', term],
                  ],
                  limit: 100000,
                },
                { signal: controller.signal }
              ).then(({ rows }) => new Set(rows.map((r) => r.slug)))
            )
          )
          let intersection = [...slugSets[0]]
          for (const set of slugSets.slice(1)) {
            intersection = intersection.filter((s) => set.has(s))
          }
          if (intersection.length === 0) {
            if (!cancelled) setState({ loading: false, rows: [], sql: '', error: null, qp })
            return
          }
          if (qp.whereIn) {
            const existing = qp.whereIn[1]
            intersection = intersection.filter((s) => existing.includes(s))
          }
          qp.whereIn = ['slug', intersection]
        }

        const res = await querySiteDb(qp, { signal: controller.signal })
        if (!cancelled) setState({ loading: false, rows: res.rows, sql: res.sql, error: null, qp })
      } catch (e) {
        if (cancelled || (e && e.name === 'AbortError')) return
        if (!cancelled) setState({ loading: false, rows: [], sql: '', error: e, qp: null })
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [JSON.stringify(params), sqlMode, nonce])

  const typeCounts = useMemo(() => {
    const counts = {}
    for (const row of state.rows) {
      for (const c of parseJsonField(row.categories, [])) {
        counts[c] = (counts[c] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [state.rows])

  function setParam(patch) {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === '') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next)
  }

  return (
    <Layout>
      <div className="content search-page">
        <h1>Search results</h1>
        <form
          action="/search"
          method="get"
          className="results-search-form"
          onSubmit={(e) => {
            e.preventDefault()
            const get = (n) => e.currentTarget.elements[n]?.value || ''
            setParam({
              query: get('query'),
              country: get('country'),
              source: get('source'),
              sort: get('sort'),
              after: get('after'),
              before: get('before'),
            })
          }}
        >
          <input type="hidden" name="query" value={params.q} />
          <input type="hidden" name="type" value={params.type} />
          <div className="results-layout">
            <div className="results-filter-slot">
              <section className="results-filters" aria-labelledby="filter-results-heading">
                <div className="results-filter-fields" tabIndex="0" role="region" aria-label="Search filters">
                  <h2 id="filter-results-heading">Filter results</h2>
                  <p className="results-filter-label">Article type</p>
                  <nav className="results-type-filters" aria-label="Article type filters">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setParam({ type: '' })
                      }}
                      aria-current={!params.type ? 'true' : undefined}
                    >
                      Top results{' '}
                      <span className="results-type-count">
                        {state.loading && state.rows.length === 0 ? '…' : state.rows.length}
                      </span>
                    </a>
                    {typeCounts.map(([name, count]) => (
                      <a
                        key={name}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setParam({ type: name })
                        }}
                        aria-current={params.type === name ? 'true' : undefined}
                      >
                        {name} <span className="results-type-count">{count}</span>
                      </a>
                    ))}
                  </nav>
                  <label htmlFor="filter-country">Country</label>
                  <select id="filter-country" name="country" value={params.country} onChange={(e) => setParam({ country: e.target.value })}>
                    <option value="">Any country</option>
                    {countries.loading && countries.rows.length === 0 && (
                      <option value="" disabled>
                        Loading countries…
                      </option>
                    )}
                    {countries.rows.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="filter-source">Source</label>
                  <select id="filter-source" name="source" value={params.source} onChange={(e) => setParam({ source: e.target.value })}>
                    <option value="">Any source</option>
                    {sources.loading && sources.rows.length === 0 && (
                      <option value="" disabled>
                        Loading sources…
                      </option>
                    )}
                    {sources.rows.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <fieldset>
                    <legend>Publication date</legend>
                    <label htmlFor="filter-after" className="visually-hidden">From</label>
                    <input id="filter-after" type="date" name="after" value={params.after} />
                    <label htmlFor="filter-before" className="visually-hidden">To</label>
                    <input id="filter-before" type="date" name="before" value={params.before} />
                  </fieldset>
                  <label htmlFor="filter-sort">Sort by</label>
                  <select id="filter-sort" name="sort" value={params.sort} onChange={(e) => setParam({ sort: e.target.value })}>
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title</option>
                  </select>
                </div>
                <div className="results-filter-actions">
                  <button type="submit" className="btn btn-secondary">
                    Apply filters
                  </button>
                  <a
                    className="results-clear"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setParam({ type: '', country: '', source: '', sort: 'relevance', after: '', before: '' })
                    }}
                  >
                    Clear filters
                  </a>
                </div>
              </section>
            </div>
            <section className="results-list" aria-label="Publication results">
              <SearchSyntaxHelp active={!params.q || sqlMode} />
              {state.error && (
                <p className="results-summary" role="alert">
                  {sqlMode ? 'SQL-like query error: ' : ''}
                  {String(state.error.message || state.error)}{' '}
                  <button type="button" className="search-syntax-example" onClick={retrySearch}>
                    Try again
                  </button>{' '}
                  {sqlMode && (
                    <Link
                      to={'/search?query=' + encodeURIComponent(params.q) + '&mode=text'}
                      className="drill-in"
                    >
                      Search as plain text instead
                    </Link>
                  )}
                </p>
              )}
              {params.q && !state.error && (
                <p className="results-summary" role="status">
                  {state.loading
                    ? state.rows.length > 0
                      ? <>Searching (showing previous results)… <Spinner /></>
                      : <>Searching… <Spinner /></>
                    : `${state.rows.length} publication${state.rows.length === 1 ? '' : 's'} matching ` +
                      (sqlMode ? <em>SQL query</em> : <em>{params.q}</em>) +
                      (state.rows.length ? ` · 1–${state.rows.length}` : '')}
                </p>
              )}
              {state.loading && state.rows.length === 0 && (
                <>
                  {!params.q && <p className="results-summary" role="status">Searching… <Spinner /></p>}
                  <SlowHint
                    active={true}
                    afterMs={10000}
                    label="The site API is taking longer than usual. Suggestions can arrive faster from the search dialog…"
                  />
                  <SkeletonSearchResults count={5} />
                </>
              )}
              {state.sql && !state.loading && (
                <details className="results-sql">
                  <summary className="meta">Generated SQL (Serveronet query: <code>{JSON.stringify(state.qp)}</code>)</summary>
                  <pre className="mono block">{state.sql}</pre>
                </details>
              )}
              {state.rows.map((row) => (
                <SearchResult key={row.slug} row={row} term={sqlMode ? '' : params.q} />
              ))}
            </section>
          </div>
        </form>
      </div>
    </Layout>
  )
}

function SearchSyntaxHelp({ active }) {
  const navigate = useNavigate()
  return (
    <div className="search-syntax-help">
      <p className="meta">
        Search supports plain text and <strong>SQL-like syntax</strong>, e.g.:{' '}
        <button
          type="button"
          className="search-syntax-example"
          onClick={() => navigate('/search?query=' + encodeURIComponent(SQL_EXAMPLES[2]))}
        >
          <code>{SQL_EXAMPLES[2]}</code>
        </button>
      </p>
    </div>
  )
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text, term) {
  const safe = escapeHtml(text || '')
  if (!term || !term.trim()) return safe
  const re = new RegExp('(' + escapeRegex(term.trim()) + ')', 'ig')
  return safe.replace(re, '<mark>$1</mark>')
}

function SearchResult({ row, term }) {
  const categories = parseJsonField(row.categories, [])
  const countries = parseJsonField(row.countries, [])
  const date = (row.published_at || '').slice(0, 10)
  let dateLabel = date
  try {
    const d = new Date(date + 'T00:00:00')
    if (!isNaN(d)) dateLabel = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
  } catch (e) {
    /* keep raw */
  }
  return (
    <article className="publication-result">
      <h3>
        <Link to={'/article/' + row.slug} dangerouslySetInnerHTML={{ __html: highlight(row.title, term) }} />
      </h3>
      <p className="result-metadata">
        <time dateTime={date}>{dateLabel}</time>
        {categories.length > 0 && <> · {categories.join(' · ')}</>}
      </p>
      <p className="result-excerpt" dangerouslySetInnerHTML={{ __html: highlight(row.short_description, term) }} />
      {countries.length > 0 && <p className="result-metadata">{countries.join(', ')}</p>}
    </article>
  )
}

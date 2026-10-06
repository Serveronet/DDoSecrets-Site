import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { querySiteDb } from '../api/siteApi.js'
import { Skeleton } from './Skeleton.jsx'

// Replica of the original search dialog markup (classes from app.css).
export default function SearchModal({ open, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [term, setTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.value = ''
      setTerm('')
      setSuggestions([])
      setSelected(null)
      setSearching(false)
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    const q = term.trim()
    if (!open || q.length < 2) {
      setSuggestions([])
      setSearching(false)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    setSearching(true)
    const t = setTimeout(() => {
      querySiteDb(
        {
          table: 'articles',
          orWhere: [
            ['title', 'like', '%' + q + '%'],
            ['short_description', 'like', '%' + q + '%'],
          ],
          orderBy: ['published_at', 'desc'],
          limit: 8,
        },
        { signal: controller.signal }
      )
        .then(({ rows }) => {
          if (cancelled) return
          setSuggestions(rows)
          setSearching(false)
        })
        .catch((e) => {
          if (cancelled || (e && e.name === 'AbortError')) return
          setSuggestions([])
          setSearching(false)
        })
    }, 250)
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(t)
    }
  }, [open, term])

  if (!open) return null

  return (
    <>
      <div
        className="search-modal-backdrop"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 998 }}
      />
      <dialog
        id="searchModal"
        className="search-modal"
        aria-label="Search publications"
        data-search-workspace
        open
        style={{ position: 'fixed', zIndex: 999, display: 'block' }}
      >
        <div className="search-content">
          <form
            className="search-form"
            action="/search"
            method="get"
            data-search-form
            onSubmit={(e) => {
              e.preventDefault()
              onClose()
              navigate('/search?query=' + encodeURIComponent(term))
            }}
          >
            <div className="search-field">
              <input
                type="search"
                id="modalSearchInput"
                ref={inputRef}
                aria-label="Search publications"
                aria-describedby="modalSearchHint"
                name="query"
                placeholder="Search titles and descriptions…"
                maxLength={200}
                autoComplete="off"
                onChange={(e) => setTerm(e.currentTarget.value)}
              />
            </div>
            <button type="button" className="search-close" onClick={onClose}>
              Close
            </button>
          </form>
          <p className="visually-hidden" data-search-status role="status" aria-live="polite" aria-atomic="true"></p>
          <p id="modalSearchHint" className="visually-hidden">
            Press Enter to search on DDoSecrets for all results. SQL-like queries are supported, e.g.
            title like 'flock' order by published_at desc limit 5
          </p>

          <div className="search-results-layout" data-search-results>
            <section aria-label="Matching publications" className="search-publications" tabIndex="0">
              <h2 className="search-panel-heading">Suggested</h2>
              {term.trim().length < 2 ? (
                <p className="meta" role="status">Type at least two characters to see suggestions.</p>
              ) : searching ? (
                <>
                  <p className="meta" role="status">Searching…</p>
                  <div aria-hidden="true">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div className="search-shortcut" key={i}>
                        <Skeleton className="skeleton-line pill" style={{ width: '1.125rem', height: '1.125rem', borderRadius: '50%', flex: '0 0 1.125rem' }} />
                        <Skeleton className="skeleton-line" style={{ width: i % 2 ? '72%' : '58%' }} />
                      </div>
                    ))}
                  </div>
                </>
              ) : suggestions.length === 0 ? (
                <p className="meta" role="status">No matching publications.</p>
              ) : (
                suggestions.map((row) => (
                  <Link
                    to={'/article/' + row.slug}
                    key={row.slug}
                    className="search-shortcut"
                    onMouseEnter={() => setSelected(row)}
                    onClick={onClose}
                  >
                    <span className="search-shortcut-icon" aria-hidden="true"></span>
                    <span>{row.title}</span>
                  </Link>
                ))
              )}
            </section>
            <section className="search-preview" aria-label="Publication preview" aria-live="polite">
              {!selected ? (
                <p data-preview-empty className="search-placeholder">
                  Select a publication to preview
                </p>
              ) : (
                <article>
                  <h3>{selected.title}</h3>
                  <p className="meta">Published on {(selected.published_at || '').slice(0, 10)}</p>
                  <p>{selected.short_description}</p>
                </article>
              )}
            </section>
          </div>
        </div>
      </dialog>
    </>
  )
}

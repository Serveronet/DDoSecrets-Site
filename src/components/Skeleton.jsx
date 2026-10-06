import { useEffect, useState } from 'react'

// Plain shimmer block.
export function Skeleton({ width, height, className = '', style, ...rest }) {
  return (
    <span
      aria-hidden="true"
      className={'skeleton ' + className}
      style={{ width, height, ...style }}
      {...rest}
    />
  )
}

export function SkeletonLines({ lines = 2, className = 'desc', widths }) {
  return (
    <>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={'skeleton-line ' + className}
          style={{ width: (widths && widths[i]) || (i === lines - 1 && lines > 1 ? '65%' : '100%') }}
        />
      ))}
    </>
  )
}

// Placeholder shaped like ArticleCard (title, meta, description, drill-in).
export function SkeletonArticleCard({ heading = 3, withPill = true }) {
  return (
    <div className="skeleton-card" data-heading={heading}>
      <Skeleton className="skeleton-line title" width="78%" />
      <Skeleton className="skeleton-line meta" />
      <SkeletonLines lines={2} />
      {withPill && <Skeleton className="skeleton-line pill" />}
    </div>
  )
}

export function SkeletonCardList({ count = 6, heading = 3, withPill = true }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonArticleCard key={i} heading={heading} withPill={withPill} />
      ))}
    </>
  )
}

// Placeholder for the fixed categories strip (ul.categories-list).
export function SkeletonCategoryStrip({ count = 6 }) {
  return (
    <ul className="categories-list" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton className="skeleton-pill" style={{ width: i % 3 === 0 ? '9.5rem' : '7.5rem' }} />
        </li>
      ))}
    </ul>
  )
}

// Placeholder for article detail pages (Article.jsx while loading).
export function SkeletonArticlePage() {
  return (
    <div className="content skeleton-article" aria-hidden="true">
      <Skeleton className="skeleton-line title" width="70%" height="2.25rem" />
      <Skeleton className="skeleton-line meta" width="40%" />
      <Skeleton width="100%" height="3rem" style={{ marginTop: '1rem' }} />
      <SkeletonLines lines={5} />
      <Skeleton className="skeleton-line title" width="45%" height="1.8rem" />
      <SkeletonLines lines={3} />
    </div>
  )
}

// Placeholder row inside the related-articles group.
export function SkeletonRelatedRow({ groups = 1, cards = 3 }) {
  return (
    <>
      {Array.from({ length: groups }, (_, g) => (
        <div className="related-articles" key={g} aria-hidden="true">
          <Skeleton className="skeleton-line title" width="30%" height="1.4rem" />
          <div className="article-row">
            {Array.from({ length: cards }, (_, i) => (
              <div className="skeleton-card" key={i}>
                <Skeleton className="skeleton-line title" width="85%" />
                <Skeleton className="skeleton-line meta" width="60%" />
                <SkeletonLines lines={2} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

// Placeholder for /search result rows.
export function SkeletonSearchResults({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-search-result" key={i} aria-hidden="true">
          <Skeleton className="skeleton-line title" width={i % 2 ? '72%' : '58%'} />
          <Skeleton className="skeleton-line meta" width="35%" />
          <SkeletonLines lines={2} />
        </div>
      ))}
    </>
  )
}

export function InlineStatus({ label = 'Loading…' }) {
  return (
    <p className="status-row" role="status">
      <Spinner />
      <span>{label}</span>
    </p>
  )
}

export function Spinner() {
  return <span className="spinner" role="img" aria-label="Loading" />
}

// Shown when a request stays in flight longer than afterMs.
export function SlowHint({ active, afterMs = 8000, label = 'This is taking longer than usual; the site API can be slow. Please wait…' }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!active) {
      setShown(false)
      return
    }
    const t = setTimeout(() => setShown(true), afterMs)
    return () => clearTimeout(t)
  }, [active, afterMs])
  if (!active || !shown) return null
  return (
    <p className="meta" role="status" style={{ fontStyle: 'italic' }}>
      {label}
    </p>
  )
}

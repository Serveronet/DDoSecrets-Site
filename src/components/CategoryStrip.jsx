import { Link } from 'react-router-dom'
import { useSiteQuery, useTableCount } from '../hooks/useSiteQuery.js'
import { Skeleton, SkeletonCategoryStrip } from './Skeleton.jsx'

// Top strip of popular categories, matching the original `.categories-list`.
// Shows pill-shaped placeholders while the Site API is still responding.
// Internal links use react-router so clicks never reload the document.
export default function CategoryStrip() {
  const { rows, loading } = useSiteQuery({
    table: 'categories',
    orderBy: ['article_count', 'desc'],
    limit: 5,
  })
  const total = useTableCount('articles')

  if (loading && rows.length === 0) return <SkeletonCategoryStrip />

  return (
    <ul className="categories-list">
      {rows.map((row) => (
        <li key={row.name + '-' + row.kind}>
          <Link to={stripHref(row.kind, row.name)}>
            {row.name} <span className="category-count">{row.article_count}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link to="/all_categories">
          All{' '}
          {total === null ? (
            <Skeleton className="skeleton-line pill" style={{ width: '3.25rem', height: '1.5rem' }} />
          ) : (
            <span className="category-count">{total}</span>
          )}
        </Link>
      </li>
    </ul>
  )
}

export function stripHref(kind, name) {
  const enc = encodeURIComponent(name)
  if (kind === 'country') return '/country/' + enc
  if (kind === 'source') return '/source/' + enc
  return '/type/' + enc
}

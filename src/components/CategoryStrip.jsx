import { useSiteQuery, useTableCount } from '../hooks/useSiteQuery.js'

// Top strip of popular categories, matching the original `.categories-list`.
export default function CategoryStrip() {
  const { rows } = useSiteQuery({
    table: 'categories',
    orderBy: ['article_count', 'desc'],
    limit: 5,
  })
  const total = useTableCount('articles')

  return (
    <ul className="categories-list">
      {rows.map((row) => (
        <li key={row.name + '-' + row.kind}>
          <a href={stripHref(row.kind, row.name)}>
            {row.name} <span className="category-count">{row.article_count}</span>
          </a>
        </li>
      ))}
      <li>
        <a href="/all_categories">
          All <span className="category-count">{total ?? ''}</span>
        </a>
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

import { Link } from 'react-router-dom'
import { useSiteQuery, useTableCount } from '../hooks/useSiteQuery.js'

// Top categories strip shown on article/list pages (original: .categories-list)
export default function CategoryNav() {
  const { rows } = useSiteQuery({
    table: 'categories',
    orderBy: ['article_count', 'desc'],
    limit: 5,
  })
  const totalCount = useTableCount('articles')

  return (
    <ul className="categories-list">
      {rows.map((cat) => (
        <li key={cat.kind + ':' + cat.name}>
          <Link to={termHref(cat.kind, cat.name)}>
            {cat.name} <span className="category-count">{cat.article_count}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link to="/all_categories">
          All <span className="category-count">{totalCount ?? ''}</span>
        </Link>
      </li>
    </ul>
  )
}

export function termHref(kind, name) {
  const enc = encodeURIComponent(name)
  if (kind === 'country') return '/country/' + enc
  if (kind === 'source') return '/source/' + enc
  return '/type/' + enc
}

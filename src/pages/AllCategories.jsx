import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import { Skeleton, SlowHint } from '../components/Skeleton.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'
import { stripHref } from '../components/CategoryStrip.jsx'

export default function AllCategories() {
  const { rows, loading, error, retry } = useSiteQuery({
    table: 'categories',
    orderBy: ['name', 'asc'],
    limit: 1000,
  })

  const byKind = (kind) => rows.filter((r) => r.kind === kind)

  return (
    <Layout>
      <div className="content all-categories">
        <h1>All Categories</h1>
        <h2>All Articles</h2>
        <ul>
          <li>
            <Link to="/all_articles/a-z">View all articles</Link>
          </li>
        </ul>

        {error ? (
          <ErrorNotice error={error} onRetry={retry} title="Could not load categories" />
        ) : loading && rows.length === 0 ? (
          <>
            <SlowHint active={true} />
            <CategoryListSkeleton title="Types" />
            <CategoryListSkeleton title="Countries" />
            <CategoryListSkeleton title="Sources" />
          </>
        ) : (
          <>
            <CategoryList title="Types" items={byKind('type')} />
            <CategoryList title="Countries" items={byKind('country')} />
            <CategoryList title="Sources" items={byKind('source')} />
          </>
        )}
      </div>
    </Layout>
  )
}

function CategoryList({ title, items }) {
  return (
    <>
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="meta notice-empty">No categories in this group.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.name}>
              <Link to={stripHref(item.kind, item.name)}>{item.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function CategoryListSkeleton({ title }) {
  return (
    <>
      <h2>{title}</h2>
      <ul aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} style={{ display: 'flex', margin: '.4rem 0' }}>
            <Skeleton className="skeleton-line" style={{ width: 90 + ((i * 37) % 140) + 'px' }} />
          </li>
        ))}
      </ul>
    </>
  )
}

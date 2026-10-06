import Layout from '../components/Layout.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'
import { stripHref } from '../components/CategoryStrip.jsx'

export default function AllCategories() {
  const { rows } = useSiteQuery({ table: 'categories', orderBy: ['name', 'asc'], limit: 1000 })

  const byKind = (kind) => rows.filter((r) => r.kind === kind)

  return (
    <Layout>
      <div className="content all-categories">
        <h1>All Categories</h1>
        <h2>All Articles</h2>
        <ul>
          <li>
            <a href="/all_articles/a-z">View all articles</a>
          </li>
        </ul>
        <CategoryList title="Types" items={byKind('type')} />
        <CategoryList title="Countries" items={byKind('country')} />
        <CategoryList title="Sources" items={byKind('source')} />
      </div>
    </Layout>
  )
}

function CategoryList({ title, items }) {
  return (
    <>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.name}>
            <a href={stripHref(item.kind, item.name)}>{item.name}</a>
          </li>
        ))}
      </ul>
    </>
  )
}

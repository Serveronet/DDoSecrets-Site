import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ArticleCard from '../components/ArticleCard.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'

export default function Author() {
  const { name } = useParams()
  const author = decodeURIComponent(name)
  const { rows, loading, error } = useSiteQuery({
    table: 'articles',
    where: [['author', '=', author]],
    orderBy: ['published_at', 'desc'],
    limit: 1000,
  })

  return (
    <Layout>
      <div className="content list-view">
        <h1>Articles by {author}</h1>
        {!loading && <p className="meta">Total Articles: {rows.length}</p>}
        {error && <p className="meta">Error: {String(error.message || error)}</p>}
        {rows.map((row) => (
          <ArticleCard key={row.slug} record={row} heading={2} />
        ))}
      </div>
    </Layout>
  )
}

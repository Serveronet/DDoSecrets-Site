import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ArticleCard from '../components/ArticleCard.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'

// /type/:name  /country/:name  /source/:name
// Lists are served from the `article_terms` relation table; each record
// carries denormalized preview fields so no join is needed (Serveronet
// records are separate and columns express relations).
export default function Term({ kind }) {
  const { name } = useParams()
  const term = decodeURIComponent(name)
  const { rows, loading, error } = useSiteQuery({
    table: 'article_terms',
    where: [
      ['kind', '=', kind],
      ['term', '=', term],
    ],
    orderBy: ['published_at', 'desc'],
    limit: 1000,
  })

  const h1 =
    kind === 'country'
      ? 'Articles from ' + term
      : kind === 'source'
        ? 'Articles with Source: ' + term
        : 'Articles of Type "' + term + '"'

  return (
    <Layout>
      <div className="content list-view">
        <h1>{h1}</h1>
        {!loading && <p className="meta">Total Articles: {rows.length}</p>}
        {error && <p className="meta">Error: {String(error.message || error)}</p>}
        {rows.map((row) => (
          <ArticleCard key={row.slug} record={row} heading={2} />
        ))}
      </div>
    </Layout>
  )
}

import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ArticleRows from '../components/ArticleRows.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'

// /type/:name  /country/:name  /source/:name
// Lists are served from the `article_terms` relation table; each record
// carries denormalized preview fields so no join is needed (Serveronet
// records are separate and columns express relations).
export default function Term({ kind }) {
  const { name } = useParams()
  const term = decodeURIComponent(name)
  const query = useSiteQuery({
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
        <ArticleRows
          query={query}
          heading={2}
          skeletonCount={8}
          showCount
          emptyText={'No articles found for "' + term + '".'}
        />
      </div>
    </Layout>
  )
}

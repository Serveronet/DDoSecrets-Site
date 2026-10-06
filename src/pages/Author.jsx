import { useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ArticleRows from '../components/ArticleRows.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'

export default function Author() {
  const { name } = useParams()
  const author = decodeURIComponent(name)
  const query = useSiteQuery({
    table: 'articles',
    where: [['author', '=', author]],
    orderBy: ['published_at', 'desc'],
    limit: 1000,
  })

  return (
    <Layout>
      <div className="content list-view">
        <h1>Articles by {author}</h1>
        <ArticleRows
          query={query}
          heading={2}
          skeletonCount={8}
          showCount
          emptyText={'No articles found for author "' + author + '".'}
        />
      </div>
    </Layout>
  )
}

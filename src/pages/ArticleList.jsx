import Layout from '../components/Layout.jsx'
import ArticleRows from '../components/ArticleRows.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'

const VARIANTS = {
  recent: {
    h1: 'All Recently Published Articles',
    query: { table: 'articles', orderBy: ['published_at', 'desc'], limit: 1000 },
  },
  edited: {
    h1: 'All Recently Edited Articles',
    query: { table: 'articles', whereNotNull: 'edited_rank', orderBy: ['edited_rank', 'asc'], limit: 1000 },
  },
  external: {
    h1: 'All External Collaboration Articles',
    query: {
      table: 'articles',
      where: [['is_external', '=', '1']],
      orderBy: ['published_at', 'desc'],
      limit: 1000,
    },
  },
  a_z: {
    h1: 'All Articles (A-Z)',
    query: { table: 'articles', orderBy: ['title', 'asc'], limit: 1000 },
  },
}

export default function ArticleList({ variant }) {
  const def = VARIANTS[variant]
  const query = useSiteQuery(def.query)

  return (
    <Layout>
      <div className="content list-view">
        <h1>{def.h1}</h1>
        <ArticleRows query={query} heading={2} skeletonCount={8} showCount />
      </div>
    </Layout>
  )
}

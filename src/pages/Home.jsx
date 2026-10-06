import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ArticleRows from '../components/ArticleRows.jsx'
import Promo from '../components/Promo.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'

export default function Home() {
  const recent = useSiteQuery({ table: 'articles', orderBy: ['published_at', 'desc'], limit: 10 })
  const edited = useSiteQuery({
    table: 'articles',
    whereNotNull: 'edited_rank',
    orderBy: ['edited_rank', 'asc'],
    limit: 10,
  })
  const collaborations = useSiteQuery({
    table: 'articles',
    where: [['is_external', '=', '1']],
    orderBy: ['published_at', 'desc'],
    limit: 10,
  })

  return (
    <Layout withPromo PromoComponent={<Promo variant="home" />}>
      <div className="content home">
        <div className="column recent-articles">
          <h2>Recently Published</h2>
          <ArticleRows query={recent} heading={3} skeletonCount={5} />
          <Link className="btn" to="/all_articles/recent">
            View All
          </Link>
        </div>

        <div className="column recently-edited-articles">
          <h2>Recently Edited</h2>
          <ArticleRows query={edited} heading={3} skeletonCount={5} />
          <Link className="btn" to="/all_articles/edited">
            View All
          </Link>
        </div>

        <div className="column external-collaboration-articles">
          <h2>Collaborations</h2>
          <ArticleRows query={collaborations} heading={3} skeletonCount={5} />
          <Link className="btn" to="/all_articles/external">
            View All
          </Link>
        </div>
      </div>
    </Layout>
  )
}

import { Link } from 'react-router-dom'
import { formatPublishedAt } from '../lib/format.js'

// Mirrors the original site markup:
// <div class="article"><hN class="article-preview-title"><a href="/article/slug">Title</a></hN>
//   <p class="meta">Published by <a href="/author/...">...</a> on ...</p>
//   <p>short description</p><a class="drill-in" ...>Read more</a></div>
export default function ArticleCard({ record, heading = 3 }) {
  const H = 'h' + heading
  const slug = record.slug
  return (
    <div className="article">
      <H className="article-preview-title">
        <Link to={'/article/' + slug}>{record.title}</Link>
      </H>
      <p className="meta">
        Published by{' '}
        <Link to={'/author/' + encodeURIComponent(record.author)}>
          {'\n      ' + record.author}
        </Link>{' '}
        on {formatPublishedAt(record.published_at)}
      </p>
      <p>{record.short_description}</p>
      <Link className="drill-in" to={'/article/' + slug} aria-label={'Read more: ' + record.title}>
        Read more
      </Link>
    </div>
  )
}

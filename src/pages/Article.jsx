import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { marked } from 'marked'
import Layout from '../components/Layout.jsx'
import Promo from '../components/Promo.jsx'
import ArticleCard from '../components/ArticleCard.jsx'
import { useSiteQuery } from '../hooks/useSiteQuery.js'
import { querySiteDb } from '../api/siteApi.js'
import { bytesToReadable, formatDateOnly, parseJsonField } from '../lib/format.js'

function MetadataLinks({ label, names, hrefFor }) {
  if (!names.length) return null
  return (
    <p>
      <span className="label">{label}</span>
      {names.map((name, i) => (
        <span key={name}>
          {i > 0 ? ', ' : '\n              '}
          <a href={hrefFor(name)}>{name}</a>
        </span>
      ))}
    </p>
  )
}

function LinkRow({ label, href, children }) {
  return (
    <p>
      <span className="label">{label}</span>{' '}
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </p>
  )
}

export default function Article() {
  const { slug } = useParams()
  const decoded = decodeURIComponent(slug)
  const { rows, loading, error } = useSiteQuery({
    table: 'articles',
    where: [['slug', '=', decoded]],
    limit: 1,
  })
  const article = rows[0]

  useEffect(() => {
    if (article) document.title = article.title + ' - Distributed Denial of Secrets'
    return () => {
      document.title = 'Distributed Denial of Secrets'
    }
  }, [article])

  if (loading) return <Layout />
  if (error)
    return (
      <Layout>
        <div className="content">
          <h2>Error</h2>
          <p>{String(error.message || error)}</p>
        </div>
      </Layout>
    )
  if (!article)
    return (
      <Layout>
        <div className="content">
          <h2>404: Not Found</h2>
          <p>The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.</p>
        </div>
      </Layout>
    )

  const categories = parseJsonField(article.categories, [])
  const countries = parseJsonField(article.countries, [])
  const sources = parseJsonField(article.sources, [])
  const links = parseJsonField(article.links, {})

  return (
    <Layout withPromo PromoComponent={<Promo variant="article" />}>
      <div className="content">
        <h1>{article.title}</h1>
        <p className="meta">Published on {formatDateOnly(article.published_at)}</p>

        <div className="metadata">
          <h2>Article Details</h2>
          <MetadataLinks
            label="Source:"
            names={sources}
            hrefFor={(n) => '/source/' + encodeURIComponent(n)}
          />
          <MetadataLinks
            label="Countries:"
            names={countries}
            hrefFor={(n) => '/country/' + encodeURIComponent(n)}
          />
          <MetadataLinks
            label="Type:"
            names={categories}
            hrefFor={(n) => '/type/' + encodeURIComponent(n)}
          />
          {Number(article.download_size) > 0 && (
            <p>
              <span className="label">Download Size:</span> {bytesToReadable(article.download_size)}
            </p>
          )}
          {(links.download || []).map((url, i) => (
            <LinkRow
              key={url + i}
              label={i === 0 ? 'Download:' : 'Download ' + (i + 1) + ':'}
              href={url}
            >
              {'Download ' + (i + 1) + ' for ' + article.title}
            </LinkRow>
          ))}
          {(links.magnet || []).map((url, i) => (
            <LinkRow
              key={url + i}
              label={i === 0 ? 'Magnet:' : 'Magnet ' + (i + 1) + ':'}
              href={url}
            >
              {'Magnet ' + (i + 1) + ' for ' + article.title}
            </LinkRow>
          ))}
          {(links.torrent || []).map((url, i) => (
            <LinkRow
              key={url + i}
              label={i === 0 ? 'Torrent:' : 'Torrent ' + (i + 1) + ':'}
              href={url}
            >
              {'Torrent ' + (i + 1) + ' for ' + article.title}
            </LinkRow>
          ))}
        </div>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: marked.parse(article.description || '') }}
        />
      </div>

      <RelatedArticles slug={decoded} categories={categories} countries={countries} />
    </Layout>
  )
}

// Lazy loaded: the related articles are fetched from the site database only
// after the section scrolls into the viewport (IntersectionObserver).
// Relation is expressed through `article_terms` rows (slug + kind + term columns).
function RelatedArticles({ slug, categories, countries }) {
  const containerRef = useRef(null)
  const startedRef = useRef(false)
  const [groups, setGroups] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return
        startedRef.current = true
        loadRelated()
        observer.disconnect()
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  async function loadRelated() {
    const terms = [
      ...categories.map((t) => ({ kind: 'type', term: t })),
      ...countries.map((t) => ({ kind: 'country', term: t })),
    ]
    const settled = await Promise.all(
      terms.map(({ kind, term }) =>
        querySiteDb({
          table: 'article_terms',
          where: [
            ['kind', '=', kind],
            ['term', '=', term],
            ['slug', '!=', slug],
          ],
          orderBy: ['published_at', 'desc'],
          limit: 3,
        }).then(({ rows }) => ({ kind, term, rows }))
      )
    )
    setGroups(settled.filter((g) => g.rows.length > 0))
  }

  const hrefFor = (kind, term) =>
    kind === 'country' ? '/country/' + encodeURIComponent(term) : '/type/' + encodeURIComponent(term)

  return (
    <div className="related-articles-group content" ref={containerRef}>
      {groups === null ? (
        <p className="meta" style={{ minHeight: '2rem' }} />
      ) : (
        <>
          <h2>Related Articles</h2>
          {groups.map((group) => (
            <div className="related-articles" key={group.kind + ':' + group.term}>
              <h3>
                <a href={hrefFor(group.kind, group.term)}>{group.term}</a>
              </h3>
              <div className="article-row">
                {group.rows.map((row) => (
                  <ArticleCard key={row.slug} record={row} heading={4} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

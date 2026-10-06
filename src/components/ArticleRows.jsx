import ArticleCard from './ArticleCard.jsx'
import ErrorNotice from './ErrorNotice.jsx'
import { SkeletonCardList, InlineStatus, SlowHint } from './Skeleton.jsx'

// Renders one Site API list query with placeholders while loading,
// stale rows plus an inline loader on background refresh, and a
// retryable error notice on failure.
export default function ArticleRows({
  query,
  heading = 3,
  skeletonCount = 6,
  emptyText = 'No articles found.',
  showCount = false,
  countLabel = (n) => `Total Articles: ${n}`,
}) {
  const { rows = [], loading, error, retry } = query

  return (
    <>
      {showCount && !loading && <p className="meta">{countLabel(rows.length)}</p>}

      {rows.length === 0 && error ? (
        <ErrorNotice error={error} onRetry={retry} title="Could not load articles" />
      ) : rows.length === 0 && loading ? (
        <>
          <SlowHint active={true} />
          <SkeletonCardList count={skeletonCount} heading={heading} />
        </>
      ) : (
        <>
          {error && <ErrorNotice error={error} onRetry={retry} title="Could not refresh articles (showing cached results)" />}
          {loading && !error && <InlineStatus label="Refreshing…" />}
          {rows.length === 0 ? (
            <p className="meta notice-empty">{emptyText}</p>
          ) : (
            rows.map((row) => <ArticleCard key={row.slug} record={row} heading={heading} />)
          )}
        </>
      )}
    </>
  )
}

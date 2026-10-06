// Error surface with retry for slow/failing Site API responses.
export default function ErrorNotice({ error, onRetry, title = 'Could not load data', compact = false }) {
  return (
    <div className="notice notice-error" role="alert">
      <p className="notice-title">{title}</p>
      <p className="notice-body">
        {String((error && (error.message || error)) || 'Unknown error')}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

import { isPromoClosed, closePromo } from '../lib/promo.js'

const bannerStyle = {
  boxSizing: 'border-box',
  width: '92vw',
  maxWidth: '1440px',
  margin: '0 auto 1rem',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: '#a24b4b',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  flexWrap: 'wrap',
  fontFamily: '"Atkinson Hyperlegible", sans-serif',
  fontSize: '0.875rem',
  fontWeight: 500,
}

const closeStyle = {
  fontFamily: '"Atkinson Bold", sans-serif',
  fontSize: '0.75rem',
  padding: '0.2rem 0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid rgba(255, 255, 255, 0.55)',
  backgroundColor: 'transparent',
  color: '#fff',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export default function MirrorBanner() {
  if (isPromoClosed()) return null

  return (
    <div className="mirror-banner" role="region" aria-label="Site notice" style={bannerStyle}>
      <span className="mirror-banner-text">This is a mirror of DDoSecrets on Serveronet</span>
      <button
        type="button"
        className="mirror-banner-close"
        id="close_mirror_banner"
        aria-label="Dismiss notice"
        onClick={closePromo}
        style={closeStyle}
      >
        Close
      </button>
    </div>
  )
}

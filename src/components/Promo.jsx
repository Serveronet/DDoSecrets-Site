import MirrorBanner from './MirrorBanner.jsx'
import { isPromoClosed, closePromo } from '../lib/promo.js'

export default function Promo({ variant }) {
  const closed = isPromoClosed()
  if (closed) return null

  const isHome = variant === 'home'
  return (
    <>
      {isHome ? <MirrorBanner /> : null}
      <div className={'content promo ' + (isHome ? 'promo-home' : 'promo-article')} id="promo">
        {isHome ? (
          <>
            <h2>Welcome to Distributed Denial of Secrets</h2>
            <p>
              We're a 501(c)(3) non-profit in the US that archives and publishes hacked and leaked documents in the
              public interest. Browse our releases, download data, or{' '}
              <a href="https://donorbox.org/ddosecrets" target="_blank" rel="noreferrer">
                donate to support our mission!
              </a>
            </p>
            <div className="btn-container">
              <a className="btn btn-primary" href="https://donorbox.org/ddosecrets" target="_blank" rel="noreferrer">
                <span className="btn-emoji">❤️</span> Donate Now
              </a>
              <button type="button" className="btn btn-tertiary" id="close_promo" onClick={closePromo}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>We need your help!</h2>
            <p>
              We are the most important and most active public library of hacked and leaked datasets in the world
              today, but we operate on a shoestring budget.
            </p>
            <div className="btn-container">
              <a className="btn btn-primary" href="https://donorbox.org/ddosecrets" target="_blank" rel="noreferrer">
                ❤️ Donate Now
              </a>
              <button type="button" className="btn btn-tertiary" id="close_promo" onClick={closePromo}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

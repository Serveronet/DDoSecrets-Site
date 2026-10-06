import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CategoryStrip from './CategoryStrip.jsx'
import Footer from './Footer.jsx'
import SearchModal from './SearchModal.jsx'

export default function Layout({ children, withCategoryStrip = true, withPromo = null, PromoComponent }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <SearchModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <header>
        <h1>
          <Link to="/">Distributed Denial of Secrets</Link>
        </h1>

        <form
          className="search-form"
          action="/search"
          method="get"
          onSubmit={(e) => {
            e.preventDefault()
            const q = e.currentTarget.querySelector('input[name="query"]').value
            navigate('/search?query=' + encodeURIComponent(q))
          }}
        >
          <div className="search-field">
            <input
              type="search"
              id="headerSearchInput"
              aria-label="Search publications"
              aria-haspopup="dialog"
              aria-controls="searchModal"
              name="query"
              placeholder="Search articles..."
              onFocus={() => setModalOpen(true)}
            />
          </div>
        </form>

        <nav aria-label="Main navigation" className="user-logged-out">
          <button
            id="searchButton"
            type="button"
            aria-label="Search publications"
            className="search-button search-input-button search-trigger"
            onClick={() => setModalOpen(true)}
          ></button>
          <button
            type="button"
            className="mobileNav btnIcon"
            aria-label="Navigation menu"
            aria-controls="header-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="menu-tag">Menu</span>
          </button>

          <ul id="header-navigation" className={menuOpen ? 'show' : ''}>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <a href="https://shop.scidsg.org/collections/ddos">Shop</a>
            </li>
            <li>
              <a href="https://github.com/ddosecrets/torrent-mirroring">Mirroring Guide</a>
            </li>
            <li>
              <Link className="btn" to="/submit">
                Submit Data
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main id="main-content" tabIndex="-1">
        {withCategoryStrip && <CategoryStrip />}
        {withPromo && PromoComponent ? PromoComponent : null}
        {children}
      </main>

      <Footer />
    </>
  )
}

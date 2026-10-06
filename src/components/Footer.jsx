import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="content">
      <p>Distributed Denial of Secrets is a 501(c)(3) non-profit.</p>
      <div className="footblock">
        <p>Support our mission:</p>
      </div>
      <div className="footblock">
        <a href="https://donorbox.org/ddosecrets" target="_blank" rel="noreferrer">Donorbox</a>
      </div>
      <div className="footblock">
        <a href="https://opencollective.com/ddosecrets">OpenCollective</a>
      </div>
      <div className="footblock">
        <a href="https://shop.scidsg.org/collections/ddos">Shop for Merch</a>
      </div>
      <br />
      <div className="footblock">
        <p>Search our documents:</p>
      </div>
      <div className="footblock">
        <a href="https://search.ddosecrets.org">Chat Logs</a>
      </div>
      <div className="footblock">
        <a href="https://search.libraryofleaks.org">Published Documents</a>
      </div>
      <div className="footblock">
        <a href="https://data.ddosecrets.org">Public Downloads</a>
      </div>
      <div className="footblock">
        <a href="https://torrents.ddosecrets.org">Torrents</a>
      </div>
      <br />
      <div className="footblock">
        <p>Contact us:</p>
      </div>
      <div className="footblock">
        <a href="https://tickets.ddosecrets.org/open.php">Request Data Access</a>
      </div>
      <div className="footblock">
        <Link to="/contact">Reach us by Email</Link>
      </div>
      <div className="footblock">
        <Link to="/submit">Submit Data</Link>
      </div>
      <br />
      <div className="footblock">
        <p>Follow us:</p>
      </div>
      <div className="footblock">
        <a href="https://bsky.app/profile/ddosecrets.org">BlueSky</a>
      </div>
      <div className="footblock">
        <a rel="me" href="https://kolektiva.social/@ddosecrets">Mastodon</a>
      </div>
    </footer>
  )
}

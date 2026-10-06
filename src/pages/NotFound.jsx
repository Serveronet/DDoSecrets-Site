import Layout from '../components/Layout.jsx'

export default function NotFound() {
  return (
    <Layout withCategoryStrip={false}>
      <div className="content">
        <h2>404: Not Found</h2>
        <p>
          The requested URL was not found on the server. If you entered the URL manually please check your
          spelling and try again.
        </p>
      </div>
    </Layout>
  )
}

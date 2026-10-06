import Layout from '../components/Layout.jsx'
import aboutHtml from '../content/about.html?raw'
import contactHtml from '../content/contact.html?raw'
import submitHtml from '../content/submit.html?raw'

const PAGES = {
  about: { html: aboutHtml, strip: true },
  contact: { html: contactHtml, strip: false },
  submit: { html: submitHtml, strip: false },
}

export default function StaticPage({ name }) {
  const page = PAGES[name]
  return (
    <Layout withCategoryStrip={page.strip}>
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
    </Layout>
  )
}

import { JSDOM, VirtualConsole } from 'jsdom'
import http from 'node:http'

const SITE = 'nldd446sazrflxsmxkgtudwnwykhlvr5dolge3klp3mqfsrycfxa'
const HOST = `${SITE}.snet.localhost:15080`
const jar = new Map()

function rawFetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const headers = {}
    for (const [k, v] of (opts.headers || []) instanceof Map ? [] : Object.entries(opts.headers || {})) headers[k] = v
    const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
    const req = http.request(
      { hostname: '127.0.0.1', port: u.port || 80, path: u.pathname + u.search, method: opts.method || 'GET', headers: { Cookie: cookie, ...headers, Host: HOST } },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          for (const c of res.headers['set-cookie'] || []) {
            const pair = c.split(';')[0]
            const i = pair.indexOf('=')
            jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim())
          }
          resolve({ ok: res.statusCode < 400, status: res.statusCode, text: async () => body, json: async () => JSON.parse(body) })
        })
      }
    )
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

async function renderRoute(path) {
  await rawFetch(`http://${HOST}/`, {}) // prime cookies
  const idx = await rawFetch(`http://${HOST}/`, {})
  const html = await idx.text()
  const assetMatch = html.match(/assets\/index-[\w-]+\.js/)
  const bundle = await (await rawFetch(`http://${HOST}/${assetMatch[0]}`, {})).text()

  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => {
    if (!/Could not load|not implemented/i.test(e.message)) errors.push('jsdomError: ' + e.message)
  })
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')))
  vc.on('warn', () => {})

  const dom = new JSDOM(html.replace(/<script type="module" src="[^"]*"><\/script>/, ''), {
    url: `http://${HOST}${path}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
  })
  const { window } = dom
  window.fetch = rawFetch
  window.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb
    }
    observe(el) {
      setTimeout(() => this.cb([{ isIntersecting: true }], this), 30)
    }
    disconnect() {}
    unobserve() {}
  }
  window.scrollTo = () => {}
  window.requestAnimationFrame = (cb) => setTimeout(cb, 16)
  // document.cookie with jar backing
  Object.defineProperty(window.document, 'cookie', {
    get: () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
    set: () => {},
  })

  const scriptEl = window.document.createElement('script')
  scriptEl.textContent = bundle
  window.document.body.appendChild(scriptEl)

  await new Promise((r) => setTimeout(r, 2500))
  return { dom, window, errors }
}

let failures = 0
async function expect(name, path, fn) {
  try {
    const { window, errors } = await renderRoute(path)
    const doc = window.document
    const info = fn(doc, window)
    const ok = info !== false && errors.length === 0
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}` + (typeof info === 'string' ? ' :: ' + info : ''))
    for (const e of errors) console.log('      console:', e.slice(0, 200))
    if (!ok) failures++
    window.close()
  } catch (e) {
    console.log(`FAIL  ${name} :: ${e.message}`)
    failures++
  }
}

await expect('home renders columns + cards', '/', (doc) => {
  const cols = doc.querySelectorAll('.content.home .column').length
  const cards = doc.querySelectorAll('.content.home .article').length
  return cols === 3 && cards >= 25 ? `columns=${cols} cards=${cards}` : false
})

await expect('article page renders', '/article/flock-alpr-camera', (doc) => {
  const h1 = doc.querySelector('.content h1')?.textContent
  const content = doc.querySelector('.article-content')
  const relatedGroups = doc.querySelectorAll('.related-articles').length
  return h1 === 'Flock ALPR camera' && content && content.innerHTML.length > 200 && relatedGroups === 3
    ? `h1 ok, related groups=${relatedGroups}`
    : `h1=${h1} related=${relatedGroups} content=${content ? content.innerHTML.length : 'none'}`
})

await expect('all_articles/recent lists 483', '/all_articles/recent', (doc) => {
  const total = doc.querySelector('.content.list-view .meta')?.textContent
  const cards = doc.querySelectorAll('.content.list-view .article').length
  return /Total Articles: 483/.test(total || '') && cards === 483 ? `cards=${cards}` : false
})

await expect('type page Hack', '/type/Hack', (doc) => {
  const h1 = doc.querySelector('.content.list-view h1')?.textContent
  const cards = doc.querySelectorAll('.article').length
  return h1 === 'Articles of Type "Hack"' && cards === 360 ? `cards=${cards}` : `h1=${h1} cards=${cards}`
})

await expect('author page', '/author/artvandelay', (doc) => {
  const h1 = doc.querySelector('.content.list-view h1')?.textContent
  const cards = doc.querySelectorAll('.article').length
  return h1 === 'Articles by artvandelay' && cards === 191 ? `cards=${cards}` : `h1=${h1} cards=${cards}`
})

await expect('all categories page', '/all_categories', (doc) => {
  const h2s = [...doc.querySelectorAll('.all-categories h2')].map((h) => h.textContent)
  return h2s.join(',') === 'All Articles,Types,Countries,Sources' ? h2s.join(',') : false
})

await expect('search text mode', '/search?query=camera', (doc) => {
  const cards = doc.querySelectorAll('.publication-result').length
  return cards > 5 ? `results=${cards}` : `results=${cards}`
})

await expect('search SQL mode', '/search?query=' + encodeURIComponent("title like 'wiki' order by published_at desc limit 5"), (doc) => {
  const cards = doc.querySelectorAll('.publication-result').length
  const sqlShown = doc.querySelector('.results-sql')
  return cards > 0 && sqlShown ? `results=${cards} sql-visible` : `results=${cards}`
})

await expect('about page', '/about', (doc) => {
  const h1 = doc.querySelector('.content h1')?.textContent
  const team = doc.querySelectorAll('.team-member').length
  return h1 === 'About Us' && team >= 4 ? `team=${team}` : false
})

await expect('submit page', '/submit', (doc) => doc.querySelector('.submit-instructions h1')?.textContent === 'Data Submission')

await expect('404 page', '/nonexistent-route', (doc) => doc.querySelector('.content h2')?.textContent === '404: Not Found')

console.log(failures ? `\n${failures} ROUTE FAILURES` : '\nALL ROUTES RENDER OK')
process.exit(failures ? 1 : 0)

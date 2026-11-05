import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
const titles = new Set()
for (const url of urls) {
  test(`Complete, indexable HTML at ${url}`, async () => {
    const path = new URL(url).pathname
    const file = path === '/' ? 'dist/index.html' : `dist${path}.html`
    const html = await readFile(file, 'utf8')
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, 'One primary heading')
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1)
    assert.ok(html.includes(`rel="canonical" href="${url}"`))
    assert.ok(html.includes('name="robots" content="index, follow'))
    assert.ok(!html.includes('<!--app-html-->'))
    const title = html.match(/<title>(.*?)<\/title>/)[1]
    assert.ok(!titles.has(title), 'Unique title')
    titles.add(title)
    const schema = JSON.parse(html.match(/<script id="page-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1])
    assert.ok(schema['@graph'].some(n => n['@type'] === 'Person'))
    if (path.startsWith('/blog/')) {
      assert.ok(html.includes('<article '))
      assert.ok(html.includes('rel="author"'))
      const article = schema['@graph'].find(n => n['@type'] === 'BlogPosting')
      assert.equal(article.url, url)
      assert.equal(article.author.name, 'Obi Emeka')
      assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/)
      assert.ok(schema['@graph'].some(n => n['@type'] === 'BreadcrumbList'))
      assert.ok(html.includes('href="/#about"'), 'Crawlable author/home links')
    }
  })
}

test('Video, substantive written answer, and related posts are available without JS', async () => {
  const html = await readFile('dist/blog/thriving-in-nigeria-through-exports.html', 'utf8')
  assert.ok(html.includes('https://i.ytimg.com/vi/905mdy0lXD0/hqdefault.jpg'))
  assert.ok(html.includes('https://www.youtube.com/watch?v=905mdy0lXD0'))
  assert.ok(html.includes('How can you build an export business from Nigeria?'))
  assert.ok(html.includes('What our ginger work illustrates'))
  assert.ok(html.includes('href="/blog/eudr-compliance-checklist"'))
  assert.ok(!html.includes('7th of November'))
  assert.ok(!html.includes('<iframe'), 'YouTube player loads only on demand')
})

test('Unknown URLs have a real not-found document rather than homepage content', async () => {
  const html = await readFile('dist/404.html', 'utf8')
  assert.ok(html.includes('Page not found'))
  assert.ok(html.includes('noindex, follow'))
  const config = JSON.parse(await readFile('vercel.json', 'utf8'))
  assert.equal(config.cleanUrls, true)
  assert.equal(config.rewrites, undefined, 'No blanket homepage rewrite')
  assert.ok(config.redirects.some(r => r.source === '/green-circle' && r.permanent))
})

test('A substantive article update preserves publication history and updates discovery dates', async () => {
  const html = await readFile('dist/blog/eudr-compliance-checklist.html', 'utf8')
  const schema = JSON.parse(html.match(/<script id="page-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1])
  const article = schema['@graph'].find(n => n['@type'] === 'BlogPosting')
  assert.equal(article.datePublished, '2026-06-15')
  assert.equal(article.dateModified, '2026-11-05')
  assert.ok(html.includes('dateTime="2026-11-05"'))
  assert.match(sitemap, /<loc>https:\/\/obiemeka.com\/blog\/eudr-compliance-checklist<\/loc><lastmod>2026-11-05<\/lastmod>/)
  const unchanged = await readFile('dist/blog/smallholder-digitization-what-works.html', 'utf8')
  const unchangedSchema = JSON.parse(unchanged.match(/<script id="page-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1])
  assert.equal(unchangedSchema['@graph'].find(n => n['@type'] === 'BlogPosting').dateModified, undefined)
})

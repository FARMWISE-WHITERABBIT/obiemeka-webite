import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import { render, renderHead, getPageSeo, pagePaths, getAllPosts, SITE, escapeHtml } from '../.prerender/entry-server.js'

const template = await readFile('dist/index.html', 'utf8')
for (const path of [...pagePaths(), '/404']) {
  if (path !== '/' && !/^\/[a-z0-9/-]+$/.test(path)) throw new Error(`Unsafe page path: ${path}`)
  const file = path === '/' ? 'dist/index.html' : `dist${path}.html`
  await mkdir(dirname(file), { recursive: true })
  const html = template.replace('<!--seo-head-->', () => renderHead(getPageSeo(path))).replace('<!--app-html-->', () => render(path))
  await writeFile(file, html)
}
// Derive the deployed sitemap from the same collection that renders the journal.
const posts = getAllPosts()
const urls = pagePaths().map(path => {
  const post = posts.find(p => path === `/blog/${p.slug}`)
  return `  <url><loc>${escapeHtml(SITE + path)}</loc>${post?.date ? `<lastmod>${escapeHtml(post.updated || post.date)}</lastmod>` : ''}</url>`
})
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
await rm('.prerender', { recursive: true })
console.log(`Pre-rendered ${pagePaths().length} pages plus the 404 page; generated sitemap.`)

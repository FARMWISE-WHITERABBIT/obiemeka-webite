import identity from './siteIdentity.json'
import { getAllPosts, getPostBySlug } from './blogPosts'

export const SITE = 'https://obiemeka.com'
export const INDEX_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
const DEFAULT_IMAGE = `${SITE}/assets/obi-emeka-portrait.jpeg`
const person = { '@id': `${SITE}/#obi-emeka`, '@type': 'Person', name: 'Obi Emeka', url: `${SITE}/#about` }
export const pagePaths = () => ['/', '/blog', '/greencircle-community', ...getAllPosts().map(p => `/blog/${p.slug}`)]
export const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c')
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export function getPageSeo(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const post = path.startsWith('/blog/') ? getPostBySlug(path.slice(6)) : null
  const known = pagePaths().includes(path)
  const url = `${SITE}${path}`
  let title = 'Obi Emeka | Agri-Tech Founder & Agricultural Export Expert | Nigeria'
  let description = 'Obi Emeka is a Nigerian agri-tech entrepreneur and agricultural export expert. Founder of WhiteRabbit Agro, OriginTrace and FarmWise, based in Enugu, Nigeria.'
  if (path === '/blog') {
    title = 'Journal: African Agriculture & Exports | Obi Emeka'
    description = 'Practical notes by Obi Emeka on agricultural exports, EUDR compliance, agro real estate, and smallholder digitization in Nigeria and Africa.'
  } else if (path === '/greencircle-community') {
    title = 'Join The Green Circle | Obi Emeka'
    description = 'Connect with investors, operators, and entrepreneurs working in African agriculture. Learn about The Green Circle community and apply to join.'
  } else if (post) {
    title = `${post.title} | Obi Emeka`
    description = post.excerpt
  } else if (!known) {
    title = 'Page not found | Obi Emeka'
    description = 'This page could not be found. Explore the journal or return to the Obi Emeka homepage.'
  }
  const graph = [...identity]
  if (known) {
    graph.push({ '@type': path === '/blog' ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`, url, name: title, description, inLanguage: 'en-NG', isPartOf: { '@id': `${SITE}/#website` } })
  }
  if (path === '/blog') {
    graph.push({ '@type': 'ItemList', itemListElement: getAllPosts().map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, url: `${SITE}/blog/${p.slug}` })) })
  }
  if (post) {
    graph.push({ '@type': 'BlogPosting', '@id': `${url}#article`, headline: post.title, description, url, mainEntityOfPage: { '@id': `${url}#webpage` }, author: person, inLanguage: 'en-NG', ...(post.date ? { datePublished: post.date } : {}), ...(post.updated ? { dateModified: post.updated } : {}), ...(post.image ? { image: new URL(post.image, SITE).href } : {}), ...(post.youtube ? { citation: `https://www.youtube.com/watch?v=${post.youtube}` } : {}) })
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ] })
  }
  return { title, description, url, known, type: post ? 'article' : 'website', image: post?.image ? new URL(post.image, SITE).href : DEFAULT_IMAGE, imageAlt: post?.image ? post.title : 'Obi Emeka — Nigerian agri-tech founder', schema: { '@context': 'https://schema.org', '@graph': graph } }
}

// The build and client navigation use exactly the same metadata.
export function headTags(seo) {
  return [
    ['link', 'rel', 'canonical', 'href', seo.url],
    ['meta', 'name', 'description', 'content', seo.description],
    ['meta', 'name', 'author', 'content', 'Obi Emeka'],
    ['meta', 'name', 'robots', 'content', seo.known ? INDEX_ROBOTS : 'noindex, follow'],
    ...Object.entries({ type: seo.type, url: seo.url, title: seo.title, description: seo.description, image: seo.image, 'image:alt': seo.imageAlt, locale: 'en_NG', site_name: 'Obi Emeka' }).map(([k, v]) => ['meta', 'property', `og:${k}`, 'content', v]),
    ...Object.entries({ card: 'summary_large_image', title: seo.title, description: seo.description, image: seo.image, 'image:alt': seo.imageAlt }).map(([k, v]) => ['meta', 'name', `twitter:${k}`, 'content', v]),
  ]
}

export function renderHead(seo) {
  return `<title>${escapeHtml(seo.title)}</title>\n` + headTags(seo).map(([tag, key, name, attr, value]) => `<${tag} ${key}="${name}" ${attr}="${escapeHtml(value)}" />`).join('\n') + `\n<script id="page-schema" type="application/ld+json">${jsonLd(seo.schema)}</script>`
}

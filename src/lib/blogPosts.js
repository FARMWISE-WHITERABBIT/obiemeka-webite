// Blog infrastructure (Component 1) — markdown-based post collection.
//
// Posts are plain markdown files with a small frontmatter block, added to
// src/content/blog/. Adding a post is: add a .md file, commit, push — no CMS,
// no database, fits the existing static Vite/React stack. Vite's
// import.meta.glob bundles every matching file at build time.
import { marked } from 'marked'

marked.use({ gfm: true, breaks: false })

const rawModules = import.meta.glob('../content/blog/*.md', { eager: true, query: '?raw', import: 'default' })

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }
  const [, fmBlock, body] = match
  const meta = {}
  fmBlock.split(/\r?\n/).forEach((line) => {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/)
    if (!kv) return
    const key = kv[1].trim()
    let value = kv[2].trim()
    // Strip matching quotes so authors can write title: "A, sentence" safely.
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    meta[key] = value
  })
  return { meta, body }
}

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

const POSTS = Object.entries(rawModules)
  .map(([path, raw]) => {
    const slug = slugFromPath(path)
    const { meta, body } = parseFrontmatter(raw)
    return {
      slug: meta.slug || slug,
      title: meta.title || slug,
      date: meta.date || '',
      excerpt: meta.excerpt || '',
      image: meta.image || '',
      youtube: meta.youtube || '',
      ctaTopic: meta.ctaTopic || '',
      html: marked.parse(body),
    }
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1))

export function getAllPosts() {
  return POSTS
}

export function getPostBySlug(slug) {
  return POSTS.find((p) => p.slug === slug) || null
}

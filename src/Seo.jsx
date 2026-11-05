import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getPageSeo, headTags, jsonLd } from './lib/seo'

export function Seo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const seo = getPageSeo(pathname)
    document.title = seo.title
    for (const [tag, key, name, attr, value] of headTags(seo)) {
      let node = document.head.querySelector(`${tag}[${key}="${name}"]`)
      if (!node) {
        node = document.createElement(tag)
        node.setAttribute(key, name)
        document.head.appendChild(node)
      }
      node.setAttribute(attr, value)
    }
    let schema = document.getElementById('page-schema')
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'page-schema'
      schema.type = 'application/ld+json'
      document.head.appendChild(schema)
    }
    schema.textContent = jsonLd(seo.schema)
  }, [pathname])
  return null
}

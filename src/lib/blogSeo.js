// Restore the previous head on navigation so article metadata cannot leak home.
export function applyBlogSeo({ title, description, path, article = false }) {
  const previousTitle = document.title
  const undo = []
  document.title = `${title} | Obi Emeka`
  const set = (selector, attribute, value) => {
    let element = document.head.querySelector(selector)
    const created = !element
    if (created) {
      element = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
      const [, key, name] = selector.match(/\[([^=]+)="([^"]+)"\]/)
      element.setAttribute(key, name)
      document.head.appendChild(element)
    }
    const previous = element.getAttribute(attribute)
    element.setAttribute(attribute, value)
    undo.push(() => {
      if (created) element.remove()
      else if (previous === null) element.removeAttribute(attribute)
      else element.setAttribute(attribute, previous)
    })
  }
  const url = `https://obiemeka.com${path}`
  set('link[rel="canonical"]', 'href', url)
  set('meta[name="description"]', 'content', description)
  for (const [key, value] of Object.entries({ title, description, url, type: article ? 'article' : 'website' })) {
    set(`meta[property="og:${key}"]`, 'content', value)
  }
  set('meta[name="twitter:title"]', 'content', title)
  set('meta[name="twitter:description"]', 'content', description)
  return () => { document.title = previousTitle; undo.reverse().forEach(fn => fn()) }
}

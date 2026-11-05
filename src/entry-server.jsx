import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
export { getPageSeo, renderHead, pagePaths, SITE, escapeHtml } from './lib/seo'
export { getAllPosts } from './lib/blogPosts'
export function render(path) {
  return renderToString(<StaticRouter location={path}><App /></StaticRouter>)
}

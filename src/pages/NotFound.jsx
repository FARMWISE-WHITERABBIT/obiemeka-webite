import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return <main className="section page-top">
    <h1>Page not found</h1>
    <p>This address does not match a page on this website.</p>
    <p><Link to="/blog">Browse the journal</Link> or <Link to="/">return home</Link>.</p>
  </main>
}

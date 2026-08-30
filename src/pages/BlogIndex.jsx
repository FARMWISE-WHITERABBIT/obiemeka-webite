import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { getAllPosts } from '../lib/blogPosts'

export default function BlogIndex() {
  const onNav = useSectionNav()
  const posts = getAllPosts()

  useEffect(() => {
    document.title = 'Journal | Obi Emeka'
  }, [])

  return (
    <>
      <Nav onNav={onNav} onPaperSection />
      <section className="section page-top" aria-label="Journal">
        <div className="section-head">
          <div>
            <span className="lab">— Journal</span>
            <h2>
              Notes from<br />
              the <em>field</em>.
            </h2>
          </div>
          <p className="lede">
            Export compliance, agro real estate, and what's actually working
            in African agri-tech right now — written from doing the work, not
            watching it.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="body-text">No posts yet — check back soon.</p>
        ) : (
          <div className="blog-grid">
            {posts.map((p) => (
              <Link className="blog-card" to={`/blog/${p.slug}`} key={p.slug}>
                {p.image && (
                  <div className="blog-card-image">
                    <img src={p.image} alt="" loading="lazy" />
                  </div>
                )}
                <div className="blog-card-body">
                  {p.date && <span className="caps blog-card-date">{formatDate(p.date)}</span>}
                  <h3>{p.title}</h3>
                  {p.excerpt && <p>{p.excerpt}</p>}
                  <span className="blog-card-read">Read <span className="arrow" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer onNav={onNav} />
    </>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

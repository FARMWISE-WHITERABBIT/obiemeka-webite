import React, { useEffect, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { getPostBySlug } from '../lib/blogPosts'
import { GreenCircleCTA } from '../GreenCircleCTA'
import { YouTubeEmbed } from '../YouTubeEmbed'

// Long posts get an extra CTA block dropped in around the midpoint, on top
// of the fixed one at the end — short posts just get the end block.
const MIN_BLOCKS_FOR_MID_CTA = 6

function splitHtmlAtMidpoint(html) {
  const blockRegex = /<\/(p|h1|h2|h3|h4|ul|ol|blockquote|pre|figure)>/gi
  const positions = []
  let m
  while ((m = blockRegex.exec(html))) positions.push(m.index + m[0].length)
  if (positions.length < MIN_BLOCKS_FOR_MID_CTA) return null
  const cut = positions[Math.floor(positions.length / 2) - 1]
  return [html.slice(0, cut), html.slice(cut)]
}

export default function BlogPost() {
  const { slug } = useParams()
  const onNav = useSectionNav()
  const post = getPostBySlug(slug)
  const halves = useMemo(() => (post ? splitHtmlAtMidpoint(post.html) : null), [post])

  useEffect(() => {
    if (post) document.title = `${post.title} | Obi Emeka`
  }, [post])

  if (!post) return <Navigate to="/blog" replace />

  return (
    <>
      <Nav onPaperSection />
      <article className="section blog-post">
        <div className="blog-post-head">
          <Link to="/blog" className="caps blog-post-back">← Journal</Link>
          {post.date && <span className="caps blog-post-date">{formatDate(post.date)}</span>}
          <h1>{post.title}</h1>
        </div>

        {post.image && (
          <div className="blog-post-image">
            <img src={post.image} alt="" />
          </div>
        )}

        {post.youtube && (
          <YouTubeEmbed videoId={post.youtube} title={post.title} />
        )}

        <div className="blog-post-body">
          {halves ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: halves[0] }} />
              <GreenCircleCTA variant="inline" campaign={post.slug} topic={post.ctaTopic} />
              <div dangerouslySetInnerHTML={{ __html: halves[1] }} />
            </>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: post.html }} />
          )}
        </div>

        <GreenCircleCTA variant="end" campaign={post.slug} topic={post.ctaTopic} />
      </article>
      <Footer onNav={onNav} />
    </>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

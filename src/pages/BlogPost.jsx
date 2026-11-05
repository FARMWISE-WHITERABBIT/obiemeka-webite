import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import NotFound from './NotFound'
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

  if (!post) return <NotFound />

  return (
    <>
      <Nav onNav={onNav} onPaperSection />
      <article className="section blog-post page-top">
        <div className="blog-post-head">
          <Link to="/blog" className="caps blog-post-back">← Journal</Link>
          {post.date && <time className="caps blog-post-date" dateTime={post.date}>{formatDate(post.date)}</time>}
          {post.updated && <span className="caps blog-post-date">Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>}
          <h1>{post.title}</h1>
          <p className="blog-post-author">By <Link to="/#about" rel="author">Obi Emeka</Link></p>
        </div>

        {post.image && (
          <div className="blog-post-image">
            <img src={post.image} alt="" />
          </div>
        )}

        {post.youtube && (
          <figure className="blog-post-video">
            <YouTubeEmbed key={post.youtube} videoId={post.youtube} title={post.title} />
            <figcaption>Watch the original discussion by Obi Emeka on <a href={`https://www.youtube.com/watch?v=${post.youtube}`}>YouTube</a>. Read the adapted discussion below.</figcaption>
          </figure>
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
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

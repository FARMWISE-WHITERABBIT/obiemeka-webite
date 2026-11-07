import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookingForm } from '../BookingForm'
import identity from '../lib/siteIdentity.json'
import { GreenCircleJoinForm } from '../GreenCircleJoinForm'
import { AgriQuizForm } from './AgriQuiz'
import { InnerCircleForm } from './InnerCircle'

const profile = identity.find(item => item['@type'] === 'Person')
const socialNames = {
  'www.linkedin.com': 'LinkedIn',
  'www.instagram.com': 'Instagram',
  'www.facebook.com': 'Facebook',
  'www.tiktok.com': 'TikTok',
  'www.youtube.com': 'YouTube',
}

function LinkLabel({ title, description }) {
  return (
    <>
      <span>
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <span className="arrow" aria-hidden="true" />
    </>
  )
}

function Offer({ id, title, description, variant = 'ink', open, children }) {
  return (
    <details id={id} className="links-booking" open={open || undefined}>
      <summary className={`btn btn-${variant} links-row`}>
        <LinkLabel title={title} description={description} />
      </summary>
      {children}
    </details>
  )
}

export default function Links() {
  const { search, hash } = useLocation()
  const params = new URLSearchParams(search)
  const quizOrder = params.get('quiz_order')
  const active = hash.slice(1) || (quizOrder ? 'quiz' : params.has('inner_circle') ? 'inner' : params.has('booking') ? 'book' : '')

  useEffect(() => {
    if (!active) return
    const offer = document.getElementById(active)
    if (offer?.tagName === 'DETAILS') {
      offer.open = true
      offer.scrollIntoView({ block: 'start' })
    }
  }, [active, search])

  return (
    <main className="section links-page">
      <header className="links-header">
        <img src="/assets/obi-emeka-links-portrait.webp" width="88" height="88" alt="" />
        <h1>Obi Emeka</h1>
        <p>Agri-tech founder and agricultural business advisor</p>
      </header>

      <section className="links-group" aria-labelledby="links-work">
        <h2 id="links-work" className="caps">Join, get advice &amp; book</h2>
        <Offer id="join" title="Join The Green Circle" description="Free community for African agriculture" variant="primary" open={active === 'join'}>
          <GreenCircleJoinForm source="links" />
        </Offer>
        <Offer id="inner" title="Join the Inner Circle" description="Monthly sessions and introductions · ₦50,000/month" open={active === 'inner' || params.has('inner_circle')}>
          <InnerCircleForm inline />
        </Offer>
        <Offer id="quiz" title="Know the Right Agricultural Business for You" description="Take the quiz here · ₦15,000 to unlock your report" open={active === 'quiz' || Boolean(quizOrder)}>
          <AgriQuizForm key={quizOrder || 'new'} inline />
        </Offer>
        <Offer id="book" title="Book a consultation" description="Choose a session and pay online for fixed-price bookings" open={active === 'book' || params.has('booking')}>
          <BookingForm returnToLinks />
        </Offer>
      </section>

      <section className="links-group" aria-labelledby="links-ventures">
        <h2 id="links-ventures" className="caps">Ventures</h2>
        {profile.founder.map(({ name, url }) => (
          <a className="btn btn-ghost links-row" href={url} key={url}>
            <LinkLabel title={name} />
          </a>
        ))}
      </section>

      <section className="links-group" aria-labelledby="links-follow">
        <h2 id="links-follow" className="caps">Read &amp; follow</h2>
        <Link className="btn btn-ghost links-row" to="/blog">
          <LinkLabel title="The Journal" description="Notes on agriculture, trade and technology" />
        </Link>
        <ul className="links-social">
          {profile.sameAs.map(url => (
            <li key={url}><a href={url}>{socialNames[new URL(url).hostname]}</a></li>
          ))}
        </ul>
      </section>
      <footer className="links-footer"><Link to="/">Visit obiemeka.com</Link></footer>
    </main>
  )
}

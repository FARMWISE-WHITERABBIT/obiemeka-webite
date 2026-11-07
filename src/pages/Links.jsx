import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookingForm } from '../BookingForm'
import identity from '../lib/siteIdentity.json'
import { GreenCircleJoinForm } from '../GreenCircleJoinForm'
import { AgriQuizForm } from './AgriQuiz'
import { trackLinks } from '../lib/linksAnalytics'
import { InnerCircleForm } from './InnerCircle'
import { SOCIAL_ITEMS } from '../sections'

const profile = identity.find(item => item['@type'] === 'Person')
const socialLinks = ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube']
  .map(name => SOCIAL_ITEMS.find(item => item.name === name))

function LinkLabel({ title, description, icon }) {
  return (
    <>
      <span className="links-offer-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <span className="links-offer-label">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <span className="arrow" aria-hidden="true" />
    </>
  )
}

const offerIcons = {
  quiz: 'M7 3h10v18H7z M10 8h4 M10 12h4 M10 16h3',
  join: 'M20 4c-8 0-13 4-13 9a4 4 0 0 0 4 4c5 0 9-5 9-13Z M4 20l9-9',
  inner: 'M12 3 4 8v8l8 5 8-5V8z M12 8v8 M8 12h8',
  book: 'M4 6h16v14H4z M8 3v6 M16 3v6 M4 11h16 M8 15h3',
  venture: 'M3 7h18v13H3z M8 7V4h8v3 M3 12c5 3 13 3 18 0 M10 13h4v3h-4z',
  journal: 'M4 5h7a2 2 0 0 1 2 2v13a3 3 0 0 0-3-2H4z M13 7a2 2 0 0 1 2-2h5v13h-4a3 3 0 0 0-3 2',
}

function Offer({ id, title, description, open, children }) {
  return (
    <details id={id} className="links-booking links-offer" open={open || undefined}>
      <summary className="btn links-row links-offer-row" onClick={event => {
        if (!event.currentTarget.parentElement.open) trackLinks('open', id)
      }}>
        <LinkLabel title={title} description={description} icon={offerIcons[id]} />
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
    <main className="section links-page links-hub">
      <header className="links-header">
        <img src="/assets/obi-emeka-links-portrait.webp" width="88" height="88" alt="" />
        <h1>Obi Emeka</h1>
        <p>Agri-tech founder and agricultural business advisor</p>
      </header>

      <section className="links-group" aria-labelledby="links-work">
        <h2 id="links-work" className="caps">Join, get advice &amp; book</h2>
        <Offer id="quiz" title="Know the right agricultural business for you" description="Take the quiz" open={active === 'quiz' || Boolean(quizOrder)}>
          <AgriQuizForm key={quizOrder || 'new'} inline />
        </Offer>
        <Offer id="join" title="Join The Green Circle" description="Free agriculture community" open={active === 'join'}>
          <p className="links-offer-intro">The Green Circle is a free WhatsApp community for investors, operators and entrepreneurs in African agriculture. It’s a place to meet people working in the sector, hear about funding and industry opportunities, and join learning sessions and meetups.</p>
          <GreenCircleJoinForm source="links" />
        </Offer>
        <Offer id="inner" title="Join the Inner Circle" description="Monthly sessions and introductions" open={active === 'inner' || params.has('inner_circle')}>
          <InnerCircleForm inline />
        </Offer>
        <Offer id="book" title="Book a Consultation" description="Professional advice with Obi Emeka" open={active === 'book' || params.has('booking')}>
          <p className="links-offer-intro">Tell me what you’re working on and where you’re stuck. Book a session and send me a short brief so I can understand what you need.</p>
          <BookingForm returnToLinks />
        </Offer>
      </section>

      <section className="links-group" aria-labelledby="links-ventures">
        <h2 id="links-ventures" className="caps">Ventures</h2>
        {profile.founder.map(({ name, url }) => (
          <a className="btn links-row links-offer-row" href={url} key={url} onClick={() => trackLinks('click', name)}>
            <LinkLabel title={name} icon={offerIcons.venture} />
          </a>
        ))}
      </section>

      <section className="links-group" aria-labelledby="links-follow">
        <h2 id="links-follow" className="caps">Read &amp; follow</h2>
        <Link className="btn links-row links-offer-row" to="/blog" onClick={() => trackLinks('click', 'journal')}>
          <LinkLabel title="The Journal" description="Notes on agriculture, trade and technology" icon={offerIcons.journal} />
        </Link>
        <ul className="links-social">
          {socialLinks.map(({ name, url, icon }) => (
            <li key={name}>
              <a href={url} aria-label={name} title={name} onClick={() => trackLinks('click', name)}>{icon}</a>
            </li>
          ))}
        </ul>
      </section>
      <footer className="links-footer"><Link to="/" onClick={() => trackLinks('click', 'homepage')}>Visit obiemeka.com</Link></footer>
    </main>
  )
}

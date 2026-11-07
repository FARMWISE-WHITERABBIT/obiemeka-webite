import React from 'react'
import { Link } from 'react-router-dom'
import { BookingForm } from '../BookingForm'
import identity from '../lib/siteIdentity.json'
import { buildGreenCircleLink } from '../lib/utm'

const profile = identity.find(item => item['@type'] === 'Person')
const socialNames = {
  'www.linkedin.com': 'LinkedIn',
  'www.instagram.com': 'Instagram',
  'www.facebook.com': 'Facebook',
  'www.tiktok.com': 'TikTok',
  'www.youtube.com': 'YouTube',
}
const joinUrl = buildGreenCircleLink({ source: 'links', medium: 'link-hub', campaign: 'green-circle' }) + '#gc-join'

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

export default function Links() {
  return (
    <main className="section links-page">
      <header className="links-header">
        <img src="/assets/obi-emeka-links-portrait.webp" width="88" height="88" alt="" />
        <h1>Obi Emeka</h1>
        <p>Agri-tech founder and agricultural business advisor</p>
      </header>

      <section className="links-group" aria-labelledby="links-work">
        <h2 id="links-work" className="caps">Connect &amp; book</h2>
        <a className="btn btn-primary links-row" href={joinUrl}>
          <LinkLabel title="Join The Green Circle" description="Apply to join the African agriculture community" />
        </a>
        <details id="book" className="links-booking">
          <summary className="btn btn-ink links-row">
            <LinkLabel title="Book a consultation" description="Choose a session and pay online for fixed-price bookings" />
          </summary>
          <BookingForm />
        </details>
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

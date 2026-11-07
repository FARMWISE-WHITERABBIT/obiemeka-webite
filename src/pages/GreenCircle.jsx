import React from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { GreenCircleJoinForm } from '../GreenCircleJoinForm'

const BENEFITS = [
  {
    n: '01',
    h: 'Real connections',
    p: 'Introductions and conversations with people actually solving the same problems, not just names sitting in a group chat.',
  },
  {
    n: '02',
    h: 'Industry intelligence',
    p: 'Funding programmes, grants, and industry updates, shared while they still matter, not after everyone else has already acted on them.',
  },
  {
    n: '03',
    h: 'Events and learning',
    p: 'Webinars and sessions with people working across farming, processing, finance, investment, technology, logistics, and export.',
  },
  {
    n: '04',
    h: 'In-person gatherings',
    p: 'Physical meetups and social activities. Hikes, runs, camping trips, time away from a screen. Building can be mentally draining, and it helps to recoup once in a while.',
  },
  {
    n: '05',
    h: 'Accountability partners',
    p: "People in the same weight class to answer to, so the plan from last month actually gets checked.",
  },
  {
    n: '06',
    h: 'For investors',
    p: 'Investment blueprints, and introductions to consultants and operators who have actually run projects worth backing.',
  },
]

// From a past Green Circle networking event — real photos, not stock
// imagery, to back up the "this is a real community" claim.
const GALLERY_IMAGES = [
  '/assets/SaveClip.App_475377846_18266977000264868_837989137282366220_n.jpg',
  '/assets/SaveClip.App_475429121_18266977198264868_6731562200085084235_n.jpg',
  '/assets/SaveClip.App_475932438_18266977183264868_8671090709736923101_n.jpg',
  '/assets/SaveClip.App_475954876_18266977027264868_343253638841141803_n.jpg',
  '/assets/SaveClip.App_475992369_18266977060264868_3154779318020706322_n.jpg',
  '/assets/SaveClip.App_476223735_18266977099264868_3229623713515563170_n.jpg',
  '/assets/SaveClip.App_476234111_18266976952264868_7395538410015496527_n.jpg',
  '/assets/SaveClip.App_476342974_18266976964264868_2586949881839520511_n.jpg',
  '/assets/SaveClip.App_476349246_18266977024264868_4445487833371868203_n.jpg',
  '/assets/SaveClip.App_476418969_18266977069264868_1960487380620007820_n.jpg',
  '/assets/SaveClip.App_476562421_18266977087264868_2175444977803350782_n.jpg',
  '/assets/SaveClip.App_476575189_18266977150264868_7523304046837873502_n.jpg',
  '/assets/SaveClip.App_476616910_18266977168264868_6765207802815623650_n.jpg',
  '/assets/SaveClip.App_476619602_18266977039264868_5745297464963985581_n.jpg',
  '/assets/SaveClip.App_476627066_18266977048264868_4998975550904757456_n.jpg',
  '/assets/SaveClip.App_476747268_18266976973264868_8581438430631720840_n.jpg',
]

export default function GreenCircle() {
  const onNav = useSectionNav()
  function scrollToJoin() {
    document.getElementById('gc-join')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Nav onNav={onNav} onPaperSection />
      <section className="section gc-landing page-top" id="greencircle-community" aria-label="Join The Green Circle">
        <div className="about gc-hero">
          <div className="about-body">
            <img className="gc-landing-logo" src="/assets/green-circle-logo.png" alt="The Green Circle" />
            <span className="lab">— 01 · The Green Circle</span>
            <h1>
              Investors, operators,<br />
              founders. <em>One room</em>.
            </h1>
            <p className="lede">
              A community where investors, operators, and entrepreneurs in
              African agriculture connect, build together, and thrive.
            </p>
            <div className="about-actions">
              <button type="button" className="btn btn-primary" onClick={scrollToJoin}>
                Join the Green Circle <span className="arrow" />
              </button>
            </div>
          </div>
          <div className="about-portrait">
            <img
              src="/assets/SaveClip.App_476747268_18266976973264868_8581438430631720840_n.jpg"
              alt="A Green Circle networking event"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div className="section-head">
          <div>
            <span className="lab">— 02 · What you get</span>
            <h2>
              What you<br />
              <em>actually get</em>.
            </h2>
          </div>
          <p className="lede">
            Here's what being in it actually looks like.
          </p>
        </div>

        <div className="expertise-grid gc-benefits">
          {BENEFITS.map((it) => (
            <div className="expertise" key={it.n}>
              <span className="e-num">— {it.n}</span>
              <div>
                <h3>{it.h}</h3>
                <p>{it.p}</p>
              </div>
              <span className="e-arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <path d="M7 11h8M11 7l4 4-4 4" stroke="currentColor" strokeWidth="1.7"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ))}
        </div>

        <div className="gc-gallery-head">
          <span className="lab">— In person</span>
          <p className="lede" style={{ maxWidth: '48ch' }}>
            Photos from a past Green Circle meetup.
          </p>
        </div>
        <div className="gc-gallery">
          {GALLERY_IMAGES.map((src) => (
            <img key={src} src={src} alt="Green Circle networking event" loading="lazy" />
          ))}
        </div>

        <div className="section-head" id="gc-join">
          <div>
            <span className="lab">— 03 · Join</span>
            <h2>
              Ready to<br />
              <em>join</em>?
            </h2>
          </div>
          <p className="lede">
            One form. A few questions about who you are and what you're
            after, so the invite actually goes to the right people.
          </p>
        </div>

        <div className="gc-grid">
          <div className="booking-side">
            <div className="num-card">
              <div className="nc-head">
                <span>— Who it's for</span>
                <span>OE / 2026</span>
              </div>
              <h3>Investors, operators, entrepreneurs.</h3>
              <p>
                Investors sizing up the opportunity, operators running the
                day-to-day, and entrepreneurs building something new. If
                African agriculture is where you're putting your time or
                your money, this is for you.
              </p>
            </div>

            <div className="num-card" style={{ marginTop: 'var(--s-4)' }}>
              <div className="nc-head">
                <span>— What happens next</span>
              </div>
              <p style={{ margin: 0 }}>
                Submitting this form puts you on the list. Once it's
                reviewed, you'll get a WhatsApp invite by email.
              </p>
            </div>
          </div>

          <div className="booking-side-form">
            <GreenCircleJoinForm />
          </div>
        </div>
      </section>
      {import.meta.env.VITE_INNER_CIRCLE_ENABLED === 'true' && (
        <section className="section tight">
          <h2>Already part of The Green Circle?</h2>
          <p>Join the Inner Circle for monthly group sessions, introductions and eligible partner events.</p>
          <Link className="btn btn-ink" to="/inner-circle">Explore the Inner Circle <span className="arrow" /></Link>
        </section>
      )}
      <Footer onNav={onNav} />
    </>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { captureUtmFromLocation } from '../lib/utm'

const INITIAL = { name: '', email: '', phone: '', memberType: '', goal: '', nickname: '' }

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

// What we actually need to vet a signup — who they are, and what they're
// looking for. The goal placeholder changes with the category so the
// question feels specific instead of generic.
const MEMBER_TYPES = [
  { value: 'diaspora-investor', label: 'Diaspora investor' },
  { value: 'nigeria-investor', label: 'Nigeria-based investor' },
  { value: 'agribusiness-owner', label: 'Agribusiness owner / operator' },
  { value: 'agritech-founder', label: 'Agri-tech startup founder' },
  { value: 'agritech-enthusiast', label: 'Agri-tech enthusiast' },
  { value: 'ag-professional', label: 'Agricultural professional / consultant' },
  { value: 'other', label: 'Other' },
]

const GOAL_PLACEHOLDERS = {
  'diaspora-investor': 'What are you looking to invest in, or learn more about?',
  'nigeria-investor': 'What are you looking to invest in, or learn more about?',
  'agribusiness-owner': 'What would help your business right now? Funding, partners, or market access?',
  'agritech-founder': 'What are you building, and what would help you most right now?',
  'agritech-enthusiast': 'What draws you to this space, and what are you hoping to learn?',
  'ag-professional': 'What kind of work are you looking to connect around?',
  'other': 'What are you hoping to get out of The Green Circle?',
}

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
  const utm = useMemo(() => captureUtmFromLocation(), [])

  const [data, setData] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    document.title = 'Join The Green Circle | Obi Emeka'
  }, [])

  function scrollToJoin() {
    document.getElementById('gc-join')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function setField(k, v) {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!data.name.trim()) e.name = 'Required'
    if (!data.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Looks invalid'
    if (!data.memberType) e.memberType = 'Required'
    if (!data.goal.trim() || data.goal.trim().length < 15) e.goal = 'A sentence or two, please'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev) {
    ev.preventDefault()
    if (status === 'loading') return
    if (!validate()) return

    setStatus('loading')
    setApiError('')

    try {
      const res = await fetch('/api/submit-green-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...utm,
          landingPath: window.location.pathname,
          referrer: document.referrer || '',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setApiError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <Nav onPaperSection />
      <section className="section gc-landing page-top" id="greencircle-community" aria-label="Join The Green Circle">
        <div className="about gc-hero">
          <div className="about-body">
            <img className="gc-landing-logo" src="/assets/green-circle-logo.png" alt="The Green Circle" />
            <span className="lab">— 01 · The Green Circle</span>
            <h2>
              Investors, operators,<br />
              founders. <em>One room</em>.
            </h2>
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
            {status === 'success' ? (
              <ConfirmationCard name={data.name} />
            ) : (
              <form className="form-card" onSubmit={submit} noValidate>
                <input type="text" name="nickname" value={data.nickname} tabIndex={-1} autoComplete="off"
                       aria-hidden="true"
                       style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                       onChange={(e) => setField('nickname', e.target.value)} />

                <div className={`field ${errors.name ? 'error' : ''}`}>
                  <label>Name</label>
                  <input value={data.name} placeholder="Your full name" maxLength={200}
                         onChange={(e) => setField('name', e.target.value)} />
                  {errors.name && <span className="err">{errors.name}</span>}
                </div>
                <div className={`field ${errors.email ? 'error' : ''}`}>
                  <label>Email</label>
                  <input type="email" value={data.email} placeholder="you@org.com" maxLength={200}
                         onChange={(e) => setField('email', e.target.value)} />
                  {errors.email && <span className="err">{errors.email}</span>}
                </div>
                <div className="field">
                  <label>WhatsApp number (optional)</label>
                  <input value={data.phone} placeholder="+234…" maxLength={40}
                         onChange={(e) => setField('phone', e.target.value)} />
                </div>

                <div className={`field ${errors.memberType ? 'error' : ''}`}>
                  <label>Which of these are you?</label>
                  <select value={data.memberType} onChange={(e) => setField('memberType', e.target.value)}>
                    <option value="" disabled>Select one</option>
                    {MEMBER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.memberType && <span className="err">{errors.memberType}</span>}
                </div>

                <div className={`field ${errors.goal ? 'error' : ''}`}>
                  <label>What are you hoping to get out of it?</label>
                  <textarea rows="3" value={data.goal} maxLength={1000}
                    placeholder={data.memberType ? GOAL_PLACEHOLDERS[data.memberType] : 'What are you hoping to get out of The Green Circle?'}
                    onChange={(e) => setField('goal', e.target.value)} />
                  {errors.goal && <span className="err">{errors.goal}</span>}
                </div>

                {status === 'error' && (
                  <div style={{
                    padding: '12px 16px', background: 'rgba(192,65,31,0.08)',
                    border: '1px solid rgba(192,65,31,0.3)', borderRadius: 'var(--r-2)',
                    color: 'var(--rust)', fontFamily: 'var(--font-mono)', fontSize: '13px',
                  }}>
                    {apiError}
                  </div>
                )}

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={status === 'loading'}
                          style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
                    {status === 'loading' ? 'Joining…' : 'Join Community'} <span className="arrow" />
                  </button>
                  <p className="pkg-note" style={{ margin: '8px 0 0' }}>
                    Signups are reviewed, so it's not instant. You'll get the WhatsApp invite by email once yours goes through.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer onNav={onNav} />
    </>
  )
}

function ConfirmationCard({ name }) {
  const firstName = (name || '').split(' ')[0]
  return (
    <div className="form-success">
      <img className="gc-confirm-logo" src="/assets/green-circle-logo.png" alt="The Green Circle" />
      <span className="caps" style={{ color: 'var(--ink)', opacity: 0.7 }}>— In review</span>
      <h3>Got it, {firstName || 'welcome'}.</h3>
      <p>
        You're on the list. Once it's reviewed, the WhatsApp invite goes to
        your email. Nothing else to do until then.
      </p>
      <p style={{ marginTop: 'var(--s-4)' }}>
        <Link to="/blog" className="btn btn-ghost">Read the journal while you wait <span className="arrow" /></Link>
      </p>
    </div>
  )
}

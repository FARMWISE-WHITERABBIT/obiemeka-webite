import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { captureUtmFromLocation } from '../lib/utm'

const INITIAL = { name: '', email: '', phone: '', nickname: '' }

// Curated from a past Green Circle networking event — real photos, not
// stock imagery, to back up the "this is a real community" claim.
const GALLERY_IMAGES = [
  '/assets/SaveClip.App_475377846_18266977000264868_837989137282366220_n.jpg',
  '/assets/SaveClip.App_475429121_18266977198264868_6731562200085084235_n.jpg',
  '/assets/SaveClip.App_475932438_18266977183264868_8671090709736923101_n.jpg',
  '/assets/SaveClip.App_476223735_18266977099264868_3229623713515563170_n.jpg',
  '/assets/SaveClip.App_476349246_18266977024264868_4445487833371868203_n.jpg',
  '/assets/SaveClip.App_476575189_18266977150264868_7523304046837873502_n.jpg',
  '/assets/SaveClip.App_476619602_18266977039264868_5745297464963985581_n.jpg',
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

  function setField(k, v) {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!data.name.trim()) e.name = 'Required'
    if (!data.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Looks invalid'
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
      <section className="section gc-landing" id="greencircle-community" aria-label="Join The Green Circle">
        <div className="section-head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <img className="gc-landing-logo" src="/assets/green-circle-logo.png" alt="The Green Circle" />
          <div>
            <span className="lab">— The Green Circle</span>
            <h2>
              Investors, operators,<br />
              founders — <em>one room</em>.
            </h2>
          </div>
          <p className="lede">
            A free WhatsApp community for farmers, agribusiness founders,
            investors, landowners, professionals and diaspora members active
            in Nigerian and African agriculture — not a generic farming
            group. Built around the same operator credibility behind
            WhiteRabbit Agro's plantation operations and OriginTrace's export
            compliance work.
          </p>
        </div>

        <div className="gc-features">
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">🤝</span>
            <h3>Real introductions</h3>
            <p>Curated intros and guided networking with people actually working the problem — the kind of relationships that turn into partnerships, investment, and market access, not just contacts.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">📈</span>
            <h3>Market intelligence</h3>
            <p>Curated market updates, funding programmes, grants and opportunities — so you hear about what matters while it's still actionable.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">📚</span>
            <h3>A working library</h3>
            <p>Templates, guides, training material and session recordings built to support better decisions and stronger execution — not a folder of stale links.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">🎤</span>
            <h3>Guest sessions</h3>
            <p>Workshops and conversations with people working across farming, processing, finance, investment, technology, logistics and export.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">🎯</span>
            <h3>Accountability partners</h3>
            <p>Founders and operators run into the same wall alone — no one checking whether the plan from last month actually happened. Find people in the same weight class to answer to.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">🧭</span>
            <h3>A growth-based identity</h3>
            <p>Being surrounded by people building at your level changes how you see your own work — this is a community to grow into, not just a channel to read.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">🛡️</span>
            <h3>Value that compounds</h3>
            <p>As the network grows, so does what it's worth — more expertise, more opportunities, more partnerships, more access for everyone already in it.</p>
          </div>
          <div className="gc-feature">
            <span className="gc-feature-emoji" aria-hidden="true">🌍</span>
            <h3>The ambition</h3>
            <p>To build one of the largest, most valuable vetted agriculture networks connecting operators, investors, professionals and diaspora across Africa and beyond.</p>
          </div>
        </div>

        <div className="gc-gallery-head">
          <span className="lab">— In person</span>
          <p className="lede" style={{ maxWidth: '48ch' }}>
            The WhatsApp group is the everyday layer — it's backed by real
            networking events where members actually meet, present, and
            argue about ideas in the same room.
          </p>
        </div>
        <div className="gc-gallery">
          {GALLERY_IMAGES.map((src) => (
            <img key={src} src={src} alt="Green Circle networking event" loading="lazy" />
          ))}
        </div>

        <div className="gc-grid">
          <div className="booking-side">
            <div className="num-card">
              <div className="nc-head">
                <span>— Who it's for</span>
                <span>OE / 2026</span>
              </div>
              <h3>Not another agriculture group.</h3>
              <p>
                Farmers, agribusiness founders, investors, landowners,
                professionals and diaspora members active in Nigerian and
                African agriculture — people who want peers who've actually
                done the work, not a generic feed.
              </p>
              <div className="when">
                <span className="chip">Farmers</span>
                <span className="chip">Founders</span>
                <span className="chip">Investors</span>
                <span className="chip">Landowners</span>
                <span className="chip">Diaspora</span>
              </div>
            </div>

            <div className="num-card" style={{ marginTop: 'var(--s-4)' }}>
              <div className="nc-head">
                <span>— What happens next</span>
              </div>
              <p style={{ margin: 0 }}>
                Submitting this form adds you to Obi's list — that's step one.
                Step two is a WhatsApp Community invite link on the next
                screen. <b>This is a WhatsApp group, not an email newsletter</b> —
                you'll join it yourself, on your own terms. Signups are
                reviewed to keep the group focused as it grows.
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
                    Free. No spam. Signups are reviewed — you'll get the WhatsApp invite by email once approved, not a newsletter signup.
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
        You're on the list. Signups are reviewed to keep the group focused
        as it grows — once yours is approved, the WhatsApp Community invite
        link lands straight in your inbox. No further steps on your end
        until then.
      </p>
      <p style={{ marginTop: 'var(--s-4)' }}>
        <Link to="/blog" className="btn btn-ghost">Read the journal while you wait <span className="arrow" /></Link>
      </p>
    </div>
  )
}

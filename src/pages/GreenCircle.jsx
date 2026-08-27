import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { captureUtmFromLocation } from '../lib/utm'

const WHATSAPP_LINK = import.meta.env.VITE_GREEN_CIRCLE_WHATSAPP_LINK || ''

const INITIAL = { name: '', email: '', phone: '', nickname: '' }

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
      <section className="section gc-landing" id="green-circle" aria-label="Join The Green Circle">
        <div className="section-head">
          <div>
            <img className="gc-landing-logo" src="/assets/green-circle-logo.png" alt="The Green Circle" />
            <span className="lab">— The Green Circle</span>
            <h2>
              Investors, operators,<br />
              founders — <em>one room</em>.
            </h2>
          </div>
          <p className="lede">
            A free WhatsApp community for people actively solving problems in
            African agriculture — not a generic farming group. Built around
            the same operator credibility behind WhiteRabbit Agro's plantation
            operations and OriginTrace's export compliance work.
          </p>
        </div>

        <div className="gc-grid">
          <div className="gc-side">
            <div className="num-card">
              <div className="nc-head">
                <span>— Who it's for</span>
                <span>OE / 2026</span>
              </div>
              <h3>Not another agriculture group.</h3>
              <p>
                The Green Circle is for investors sizing up agri-opportunities,
                operators running the day-to-day, and founders building in the
                space — people who want peers who've actually done the work,
                not a generic feed.
              </p>
              <div className="when">
                <span className="chip">Investors</span>
                <span className="chip">Operators</span>
                <span className="chip">Founders</span>
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
                you'll join it yourself, on your own terms.
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
                    Free. No spam. You'll get a WhatsApp invite link next — not a newsletter signup.
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
      <span className="caps" style={{ color: 'var(--ink)', opacity: 0.7 }}>— You're in</span>
      <h3>Got it, {firstName || 'welcome'}.</h3>
      <p>
        You're on the list. The Green Circle itself lives on WhatsApp — hit
        the button below to join the group. You're choosing to join, so
        nothing happens on our end until you tap it.
      </p>
      {WHATSAPP_LINK ? (
        <a className="btn btn-primary" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
          Join the Green Circle WhatsApp Community <span className="arrow" />
        </a>
      ) : (
        <p className="pkg-note">
          WhatsApp invite link isn't configured yet — set VITE_GREEN_CIRCLE_WHATSAPP_LINK.
        </p>
      )}
      <p style={{ marginTop: 'var(--s-4)' }}>
        <Link to="/blog" className="btn btn-ghost">Read the journal <span className="arrow" /></Link>
      </p>
    </div>
  )
}

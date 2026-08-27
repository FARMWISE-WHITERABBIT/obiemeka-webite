import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../sections'
import { useSectionNav } from '../useSectionNav'
import { captureUtmFromLocation } from '../lib/utm'

const INITIAL = { name: '', email: '', phone: '', nickname: '' }

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
              A place to<br />
              <em>compare notes</em>.
            </h2>
          </div>
          <p className="lede">
            I run a plantation and a compliance platform, so most of what I
            know about African agriculture I learned by doing it, not
            reading about it. The Green Circle is a free WhatsApp group for
            investors, operators, and entrepreneurs who want the same —
            people who've actually run into the problem you're working on,
            not a generic agriculture feed.
          </p>
        </div>

        <div className="gc-summary">
          <p>
            Members trade what's actually working — deals, hiring,
            compliance headaches, where the money's moving right now. When
            something useful comes up, a grant, a training, someone worth
            knowing, it gets passed around instead of sitting in an inbox.
            A few people have started using it to find accountability
            partners, which wasn't the original plan, but it's turned into
            one of the better reasons to be in it.
          </p>
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

        <div className="gc-grid">
          <div className="booking-side">
            <div className="num-card">
              <div className="nc-head">
                <span>— Who it's for</span>
                <span>OE / 2026</span>
              </div>
              <h3>Investors, operators, entrepreneurs.</h3>
              <p>
                If you're solving a real problem in African agriculture,
                this is for you. It's not a general audience — that's what
                keeps it useful.
              </p>
              <div className="when">
                <span className="chip">Investors</span>
                <span className="chip">Operators</span>
                <span className="chip">Entrepreneurs</span>
              </div>
            </div>

            <div className="num-card" style={{ marginTop: 'var(--s-4)' }}>
              <div className="nc-head">
                <span>— What happens next</span>
              </div>
              <p style={{ margin: 0 }}>
                Submitting this form puts you on the list. Once it's
                reviewed, you'll get a WhatsApp invite by email —
                <b> it's a WhatsApp group, not a newsletter</b>, so nothing
                lands in your inbox until that invite does.
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
                    Free. Signups are reviewed, so it's not instant — you'll get the WhatsApp invite by email once yours goes through.
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
        your email — nothing else to do until then.
      </p>
      <p style={{ marginTop: 'var(--s-4)' }}>
        <Link to="/blog" className="btn btn-ghost">Read the journal while you wait <span className="arrow" /></Link>
      </p>
    </div>
  )
}

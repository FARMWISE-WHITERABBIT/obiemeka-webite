import React, { useState, useEffect, useMemo } from 'react'
import { SCHEDULING_URLS } from './schedulingLinks'

export const SESSIONS = [
  { id: 'discovery',  name: 'Discovery Call',                  price: '₦150,000 · 45 min' },
  { id: 'compliance', name: 'Compliance Audit Session',         price: '₦400,000 · 2 hrs' },
  { id: 'strategy',   name: 'Export Strategy Session',          price: '₦750,000 · 5 hrs cumulative' },
  { id: 'investment', name: 'Agri-Investment Advisory Session', price: '₦600,000 · 3 hrs' },
  { id: 'retainer',   name: 'Advisory Retainer',                price: '₦850,000 / month' },
  { id: 'speaking',   name: 'Speaking Engagement',              price: 'Quote on request' },
]

export const TOPICS = [
  'Export compliance (EUDR / UK / US / CN / UAE)',
  'Agro real estate development & management',
  'Agri-tech product strategy',
  'Supply-chain traceability',
  'Cooperative / aggregator digitization',
  'Investor introductions & due-diligence',
  'Speaking — Export compliance & EUDR',
  'Speaking — African agri-tech & investment',
  'Speaking — Smallholder digitization',
  'Speaking — Agro real estate',
  "Other — I'll explain below",
]

const REQUIRED_FIELDS = ['name', 'email', 'org', 'session', 'topic', 'challenge']

// Sessions with a fixed price are paid for via Flutterwave before the booking
// is confirmed — keep this in sync with SESSION_PRICING in api/_lib/booking.js.
const PAYABLE_SESSIONS = ['discovery', 'compliance', 'strategy', 'investment']

const INITIAL = {
  name: '', email: '', org: '', role: '',
  session: 'discovery', topic: TOPICS[0],
  challenge: '', timing: 'Within 2 weeks',
  nickname: '', // honeypot — real users never see or fill this
}

export function BookingForm({ pickedSession, onPickSession, pickedTopic }) {
  const [data, setData] = useState({ ...INITIAL, session: pickedSession || 'discovery' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [refNum, setRefNum] = useState('')
  const [apiError, setApiError] = useState('')
  const [paidReturn, setPaidReturn] = useState(false)
  const [paidSession, setPaidSession] = useState('')

  useEffect(() => {
    if (pickedSession) {
      setData((d) => ({ ...d, session: pickedSession }))
    }
  }, [pickedSession])

  useEffect(() => {
    if (pickedTopic) {
      setData((d) => ({ ...d, topic: pickedTopic }))
    }
  }, [pickedTopic])

  // After a Flutterwave payment, /api/verify-payment redirects back here with
  // ?booking=success|processing|failed(&ref=...) — pick that up once on load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const booking = params.get('booking')
    if (!booking) return

    if (booking === 'success') {
      setRefNum(params.get('ref') || '')
      setPaidSession(params.get('session') || '')
      setPaidReturn(true)
      setStatus('success')
    } else if (booking === 'processing') {
      // Payment (usually a bank transfer) is still settling — it will be
      // confirmed by webhook and the receipt email once it lands.
      const ref = params.get('ref') || ''
      setStatus('error')
      setApiError(`Your payment${ref ? ` (ref ${ref})` : ''} is still processing. If you completed the transfer, you'll receive a confirmation email once it settles — no need to pay again.`)
    } else if (booking === 'failed') {
      setStatus('error')
      setApiError('Payment did not go through. Please try again — you have not been charged.')
    }

    params.delete('booking')
    params.delete('ref')
    params.delete('session')
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash
    window.history.replaceState({}, '', cleanUrl)
  }, [])

  const progress = useMemo(() => {
    const filled = REQUIRED_FIELDS.filter((k) => String(data[k] || '').trim().length > 0).length
    return Math.round((filled / REQUIRED_FIELDS.length) * 100)
  }, [data])

  function setField(k, v) {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!data.name.trim()) e.name = 'Required'
    if (!data.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Looks invalid'
    if (!data.org.trim()) e.org = 'Required'
    if (!data.challenge.trim() || data.challenge.trim().length < 30)
      e.challenge = 'A few sentences, please'
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
      const res = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.error || 'Something went wrong. Please try again.')
      }

      if (json.paymentUrl) {
        window.location.href = json.paymentUrl
        return
      }

      setRefNum(json.ref)
      setStatus('success')
      setTimeout(() => {
        document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    } catch (err) {
      setStatus('error')
      setApiError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const sessionMeta = SESSIONS.find((s) => s.id === data.session) || SESSIONS[0]

  const scheduleUrl = paidReturn ? SCHEDULING_URLS[paidSession] : ''

  if (status === 'success') {
    return (
      <div className="form-success">
        <span className="caps" style={{ color: 'var(--ink)', opacity: 0.7 }}>— Confirmed</span>
        <h3>Got it. Talk soon.</h3>
        {paidReturn ? (
          <p>
            Payment received and your brief is in. A confirmation with your
            receipt is on its way to your inbox.
            {scheduleUrl
              ? ' Next step: pick a time for your session below.'
              : ' Expect a reply within 48 hours on weekdays.'}
          </p>
        ) : (
          <p>
            A confirmation is on its way to <b>{data.email}</b>. Expect a reply
            within 48 hours on weekdays. If you booked an Export Strategy Session,
            an invoice and calendar invite follow in the same thread.
          </p>
        )}
        <div className="receipt">
          <div className="row"><span>Ref</span><span><b>{refNum}</b></span></div>
          {!paidReturn && (
            <>
              <div className="row"><span>Name</span><span>{data.name}</span></div>
              <div className="row"><span>Org</span><span>{data.org || '—'}</span></div>
              <div className="row"><span>Session</span><span>{sessionMeta.name}</span></div>
              <div className="row"><span>Topic</span>
                <span style={{ maxWidth: '24ch', textAlign: 'right' }}>{data.topic}</span>
              </div>
              <div className="row"><span>Timing</span><span>{data.timing}</span></div>
            </>
          )}
          <div className="row"><span>Status</span><span><b>{paidReturn ? 'Paid · Pending review' : 'Pending review'}</b></span></div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
          {scheduleUrl && (
            <a className="btn btn-primary" href={scheduleUrl} target="_blank" rel="noreferrer">
              Schedule your session <span className="arrow" />
            </a>
          )}
          <button className="btn btn-ink"
                  onClick={() => { setStatus('idle'); setPaidReturn(false); setPaidSession(''); setData({ ...INITIAL, session: pickedSession || 'discovery' }) }}>
            Book another <span className="arrow" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <div className="form-progress">
        <span>— Brief</span>
        <span className="bar"><i style={{ width: progress + '%' }} /></span>
        <span>{progress}%</span>
      </div>

      {/* Honeypot — hidden from real users, catches basic bots that auto-fill every field */}
      <input type="text" name="nickname" value={data.nickname} tabIndex={-1} autoComplete="off"
             aria-hidden="true"
             style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
             onChange={(e) => setField('nickname', e.target.value)} />

      <div className="field-row">
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
      </div>

      <div className="field-row">
        <div className={`field ${errors.org ? 'error' : ''}`}>
          <label>Organisation</label>
          <input value={data.org} placeholder="Company, ministry, cooperative…" maxLength={200}
                 onChange={(e) => setField('org', e.target.value)} />
          {errors.org && <span className="err">{errors.org}</span>}
        </div>
        <div className="field">
          <label>Role / title</label>
          <input value={data.role} placeholder="Founder, Director, etc. (optional)" maxLength={200}
                 onChange={(e) => setField('role', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Session type</label>
        <div className="session-pick">
          {SESSIONS.map((s) => (
            <button type="button" key={s.id}
                    className={data.session === s.id ? 'active' : ''}
                    onClick={() => { setField('session', s.id); onPickSession?.(s.id) }}>
              <span className="name">{s.name}</span>
              <span className="price">{s.price}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Topic</label>
          <select value={data.topic} onChange={(e) => setField('topic', e.target.value)}>
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Timing</label>
          <select value={data.timing} onChange={(e) => setField('timing', e.target.value)}>
            <option>This week</option>
            <option>Within 2 weeks</option>
            <option>Within a month</option>
            <option>Exploring — no rush</option>
          </select>
        </div>
      </div>

      <div className={`field ${errors.challenge ? 'error' : ''}`}>
        <label>The challenge</label>
        <textarea rows="5" value={data.challenge} maxLength={5000}
          placeholder="A few sentences on the specific problem you'd like help with. The more concrete you can be — a brief, a deck, a deadline — the better."
          onChange={(e) => setField('challenge', e.target.value)} />
        {errors.challenge && <span className="err">{errors.challenge}</span>}
      </div>

      {status === 'error' && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(192,65,31,0.08)',
          border: '1px solid rgba(192,65,31,0.3)',
          borderRadius: 'var(--r-2)',
          color: 'var(--rust)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
        }}>
          {apiError}
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={status === 'loading'}
                style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
          {status === 'loading'
            ? 'Sending…'
            : PAYABLE_SESSIONS.includes(data.session) ? 'Continue to payment' : 'Send brief'}
          {' '}<span className="arrow" />
        </button>
        {PAYABLE_SESSIONS.includes(data.session) && (
          <p className="pkg-note" style={{ margin: '8px 0 0' }}>
            You'll pay {sessionMeta.price.split('·')[0].trim()} via Flutterwave on the next screen — nothing is charged until then.
          </p>
        )}
      </div>
    </form>
  )
}


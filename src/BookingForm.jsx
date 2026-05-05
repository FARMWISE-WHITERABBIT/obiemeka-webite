import React, { useState, useEffect, useMemo } from 'react'

export const SESSIONS = [
  { id: 'discovery', name: 'Discovery Call',      price: '₦50,000 · 60 min' },
  { id: 'strategy',  name: 'Strategy Session',    price: '₦450,000 · 3 hrs cumulative' },
  { id: 'retainer',  name: 'Advisory Retainer',   price: '₦400,000 / month' },
  { id: 'speaking',  name: 'Speaking Engagement', price: 'Quote on request' },
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

const INITIAL = {
  name: '', email: '', org: '', role: '',
  session: 'discovery', topic: TOPICS[0],
  challenge: '', timing: 'Within 2 weeks',
}

export function BookingForm({ pickedSession, onPickSession }) {
  const [data, setData] = useState({ ...INITIAL, session: pickedSession || 'discovery' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [refNum, setRefNum] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (pickedSession && pickedSession !== data.session) {
      setData((d) => ({ ...d, session: pickedSession }))
    }
  }, [pickedSession])

  const required = ['name', 'email', 'org', 'session', 'topic', 'challenge']
  const progress = useMemo(() => {
    const filled = required.filter((k) => String(data[k] || '').trim().length > 0).length
    return Math.round((filled / required.length) * 100)
  }, [data])

  function setField(k, v) {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!data.name.trim()) e.name = 'Required'
    if (!data.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Looks invalid'
    if (!data.org.trim()) e.org = 'Required'
    if (!data.challenge.trim() || data.challenge.trim().length < 30)
      e.challenge = 'A few sentences, please'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev) {
    ev.preventDefault()
    if (!validate()) return

    setStatus('loading')
    setApiError('')

    try {
      const res = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Something went wrong. Please try again.')
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

  if (status === 'success') {
    return (
      <div className="form-success">
        <span className="caps" style={{ color: 'var(--ink)', opacity: 0.7 }}>— Confirmed</span>
        <h3>Got it. Talk soon.</h3>
        <p>
          A confirmation is on its way to <b>{data.email}</b>. Expect a reply
          within 48 hours on weekdays. If you booked a Strategy Session, an
          invoice and calendar invite follow in the same thread.
        </p>
        <div className="receipt">
          <div className="row"><span>Ref</span><span><b>{refNum}</b></span></div>
          <div className="row"><span>Name</span><span>{data.name}</span></div>
          <div className="row"><span>Org</span><span>{data.org || '—'}</span></div>
          <div className="row"><span>Session</span><span>{sessionMeta.name}</span></div>
          <div className="row"><span>Topic</span>
            <span style={{ maxWidth: '24ch', textAlign: 'right' }}>{data.topic}</span>
          </div>
          <div className="row"><span>Timing</span><span>{data.timing}</span></div>
          <div className="row"><span>Status</span><span><b>Pending review</b></span></div>
        </div>
        <button className="btn btn-ink" style={{ alignSelf: 'flex-start' }}
                onClick={() => { setStatus('idle'); setData({ ...INITIAL }) }}>
          Book another <span className="arrow" />
        </button>
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

      <div className="field-row">
        <div className={`field ${errors.name ? 'error' : ''}`}>
          <label>Name</label>
          <input value={data.name} placeholder="Your full name"
                 onChange={(e) => setField('name', e.target.value)} />
          {errors.name && <span className="err">{errors.name}</span>}
        </div>
        <div className={`field ${errors.email ? 'error' : ''}`}>
          <label>Email</label>
          <input type="email" value={data.email} placeholder="you@org.com"
                 onChange={(e) => setField('email', e.target.value)} />
          {errors.email && <span className="err">{errors.email}</span>}
        </div>
      </div>

      <div className="field-row">
        <div className={`field ${errors.org ? 'error' : ''}`}>
          <label>Organisation</label>
          <input value={data.org} placeholder="Company, ministry, cooperative…"
                 onChange={(e) => setField('org', e.target.value)} />
          {errors.org && <span className="err">{errors.org}</span>}
        </div>
        <div className="field">
          <label>Role / title</label>
          <input value={data.role} placeholder="Founder, Director, etc. (optional)"
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
        <textarea rows="5" value={data.challenge}
          placeholder="A few sentences on the specific problem you'd like to work on. The more concrete, the better — paste a brief, link a deck, name the deadline."
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
          font: 'var(--mono)',
          fontSize: '13px',
        }}>
          {apiError}
        </div>
      )}

      <div className="form-actions">
        <span className="left-meta">Replies within 48h, on weekdays</span>
        <button className="btn btn-primary" type="submit" disabled={status === 'loading'}
                style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
          {status === 'loading' ? 'Sending…' : 'Send brief'} <span className="arrow" />
        </button>
      </div>
    </form>
  )
}

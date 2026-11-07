import { isWhatsAppPhone } from './lib/whatsAppPhone'
import { trackLinks } from './lib/linksAnalytics'
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { captureUtmFromLocation } from './lib/utm'

const INITIAL = { name: '', email: '', phone: '', memberType: '', goal: '', nickname: '' }

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

export function GreenCircleJoinForm({ source }) {
  const utm = useMemo(() => ({ ...(source ? { utm_source: source, utm_medium: 'link-hub' } : {}), ...captureUtmFromLocation() }), [source])

  const [data, setData] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [apiError, setApiError] = useState('')

  function setField(k, v) {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e = {}
    if (!data.name.trim()) e.name = 'Required'
    if (!data.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Looks invalid'
    if (!data.phone.trim()) e.phone = 'Required'
    else if (!isWhatsAppPhone(data.phone)) e.phone = 'Enter a valid WhatsApp number, including your country code if outside Nigeria.'
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
      trackLinks('submitted', 'join')
    } catch (err) {
      setStatus('error')
      setApiError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return status === 'success' ? (
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
      <div className={`field ${errors.phone ? 'error' : ''}`}>
        <label htmlFor="green-circle-whatsapp">WhatsApp number</label>
        <input id="green-circle-whatsapp" type="tel" autoComplete="tel" required
               aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'green-circle-phone-error' : undefined}
               value={data.phone} placeholder="+234…" maxLength={40}
               onChange={(e) => setField('phone', e.target.value)} />
        {errors.phone && <span id="green-circle-phone-error" className="err">{errors.phone}</span>}
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

import React, { useState } from 'react'
import { openFlutterwaveCheckout } from '../lib/flutterwaveCheckout'
import { Link, useSearchParams } from 'react-router-dom'

export function InnerCircleForm({ inline = false }) {
  const [params] = useSearchParams()
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const returned = paymentSubmitted || params.has(inline ? 'inner_circle' : 'returned')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function checkout(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/inner-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.get('email'), consent: fields.get('consent') === 'on' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not open checkout.')
      const payment = await openFlutterwaveCheckout(data)
      if (payment) setPaymentSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="agri-quiz links-panel-content">
      <p>A paid upgrade for members of the free Green Circle community who want closer access to people and opportunities in African agriculture.</p>
      <p><strong>₦50,000 per month</strong></p>
      <ul>
        <li>A monthly live group session with Obi Emeka.</li>
        <li>Access to selected contacts and relevant introductions across Obi’s network.</li>
        <li>Included access to eligible sessions with partner organisations, including banks.</li>
        <li>Updates on relevant industry programmes and opportunities in a private WhatsApp group.</li>
      </ul>
      <p>After payment is verified, the team will contact you to arrange access to the WhatsApp group.</p>
      {error && <p role="alert">{error}</p>}
      {returned && <div>
        <p role="status">If your payment went through, we’ll verify it and contact you using the email you entered. For help, email <a href="mailto:oe@obiemeka.com">oe@obiemeka.com</a>.</p>
        <p>{!paymentSubmitted && <Link to="/links#inner">Return to checkout if you did not pay</Link>}</p>
      </div>}
      {!returned && (
        <form className="form-card" onSubmit={checkout}>
          <label>Your Green Circle email <input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
          <div><input id="inner-circle-consent" name="consent" type="checkbox" required />{' '}
            <label htmlFor="inner-circle-consent">I agree to an initial ₦50,000 card payment and automatic ₦50,000 monthly renewals until I cancel. I can cancel through Flutterwave’s billing emails or contact the team.</label>
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Opening checkout…' : 'Continue to Flutterwave'}</button>
        </form>
      )}
      <p>New to Green Circle? <Link to="/links#join">Join the free community</Link>.</p>
    </div>
  )
}

export default function InnerCircle() {
  return (
    <main className="section links-page">
      <Link to="/links">← Obi Emeka links</Link>
      <h1>Green Circle Inner Circle</h1>
      <InnerCircleForm />
    </main>
  )
}

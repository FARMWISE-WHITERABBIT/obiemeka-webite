import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const fields = [
  ['goal', 'What do you most want the business to do?', {
    cashflow: 'Generate operating cash flow', buildBusiness: 'Build a business I can scale', legacy: 'Build a long-term family asset',
  }],
  ['role', 'What role will you take?', {
    operator: 'Run the business myself', partner: 'Operate alongside a partner', passive: 'Provide capital with limited involvement',
  }],
  ['capitalPosition', 'After protecting household reserves and meeting your obligations, what can you afford to put at risk?', {
    noRiskCapital: 'No spare capital right now', pilotOnly: 'Enough for a small pilot', canFundOperations: 'Enough for setup and an operating reserve',
  }],
  ['cashHorizon', 'How soon do you need the business to start generating cash?', {
    short: 'Within 3 months', medium: 'In 3 to 12 months', long: 'I can wait more than a year',
  }],
  ['skills', 'Which relevant skill is your strongest today?', {
    none: 'I am starting from scratch', production: 'Farming or production', sales: 'Sales or procurement',
    operations: 'Operations or logistics', services: 'Technical or professional services',
  }],
  ['funding', 'Where would the money for your pilot come from?', {
    ownFunds: 'My own available funds', partnerFunds: 'Capital committed by a partner', borrowed: 'A loan or other borrowing',
  }],
  ['lossTolerance', 'How much of the pilot budget could you lose without disrupting your other plans?', {
    low: 'Very little', moderate: 'Part of it', high: 'The full pilot budget',
  }],
  ['oversight', 'How will you supervise the business?', {
    local: 'I can be on site regularly', visits: 'I can visit periodically', remote: 'I will supervise remotely',
  }],
  ['buyerAccess', 'Can you reach a potential buyer and confirm their terms?', { yes: 'Yes', no: 'No' }],
  ['siteAccess', 'Do you have access to a suitable operating site and the utilities it needs?', { yes: 'Yes', no: 'No' }],
  ['operatingCoverage', 'Can someone reliable cover day-to-day operations when you are away?', { yes: 'Yes', no: 'No' }],
]

async function request(body) {
  const response = await fetch('/api/agri-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Please try again.')
  return data
}

export default function AgriQuiz() {
  const [params] = useSearchParams()
  const reference = params.get('order')
  const transactionId = params.get('transaction_id')
  const [verified, setVerified] = useState(false)
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const enabled = import.meta.env.VITE_AGRI_QUIZ_ENABLED === 'true'

  async function run(action) {
    setError('')
    setBusy(true)
    try { await action() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  function verify() {
    return run(async () => {
      const result = await request({ action: 'verify', reference, transactionId })
      setReport(result.report)
      setVerified(true)
    })
  }

  useEffect(() => {
    if (enabled && reference) void verify()
  }, [enabled, reference, transactionId])

  function checkout(event) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get('email')
    return run(async () => {
      const result = await request({ action: 'checkout', email })
      window.location.assign(result.checkoutUrl)
    })
  }

  function submit(event) {
    event.preventDefault()
    const answers = Object.fromEntries(new FormData(event.currentTarget))
    answers.weeklyHours = Number(answers.weeklyHours)
    for (const key of ['buyerAccess', 'siteAccess', 'operatingCoverage']) answers[key] = answers[key] === 'yes'
    return run(async () => {
      const result = await request({ action: 'report', reference, answers })
      setReport(result.report)
    })
  }

  return (
    <main className="section links-page agri-quiz">
      <Link to="/links">← Obi Emeka links</Link>
      <h1>Know the Right Agricultural Business for You</h1>
      <p>Explore agribusiness routes against your available capital, time, experience and goals. Get a personalised shortlist, the gaps to close and a practical validation step.</p>
      <p><strong>₦15,000 one-time payment</strong></p>
      {error && <p role="alert">{error}</p>}
      {!enabled && <p>Checkout is not open yet.</p>}
      {enabled && !reference && (
        <form className="form-card" onSubmit={checkout}>
          <label>Email address <input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Opening checkout…' : 'Continue to Flutterwave'}</button>
          <p>Use this browser after payment to complete the assessment and reopen your report.</p>
        </form>
      )}
      {enabled && reference && !verified && (
        <button className="btn btn-primary" disabled={busy} onClick={verify}>{busy ? 'Checking payment…' : 'Check payment'}</button>
      )}
      {verified && !report && (
        <form className="form-card" onSubmit={submit}>
          <h2>Your circumstances</h2>
          <label>How many hours a week can you personally give the business?
            <input type="number" name="weeklyHours" min="0" max="168" step="1" required />
          </label>
          {fields.map(([id, prompt, options]) => (
            <label key={id}>{prompt}
              <select name={id} required defaultValue="">
                <option value="" disabled>Choose an answer</option>
                {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ))}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Preparing your report…' : 'Get my report'}</button>
        </form>
      )}
      {report && (
        <section aria-labelledby="quiz-report">
          <h2 id="quiz-report">Your agribusiness fit report</h2>
          <p><strong>Start here.</strong> {report.nextStep}</p>
          {report.shortlist.map(route => (
            <article key={route.id}>
              <h3>{route.name}</h3>
              <ul>{route.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
              <p>{route.nextStep}</p>
            </article>
          ))}
          {!!report.revisit.length && <h3>Routes to revisit after closing these gaps</h3>}
          {report.revisit.map(route => (
            <article key={route.id}>
              <h4>{route.name}</h4>
              <ul>{route.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>
            </article>
          ))}
          <p>Check local costs, demand and operating requirements before committing capital. This assessment screens for business fit and does not estimate returns.</p>
        </section>
      )}
    </main>
  )
}

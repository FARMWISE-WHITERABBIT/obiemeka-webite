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

export function AgriQuizForm({ inline = false }) {
  const [params] = useSearchParams()
  const reference = params.get(inline ? 'quiz_order' : 'order')
  const transactionId = params.get('transaction_id')
  const [verified, setVerified] = useState(false)
  const [report, setReport] = useState(null)
  const [emailed, setEmailed] = useState(false)
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
      setEmailed(result.emailed)
      setVerified(true)
    })
  }

  useEffect(() => {
    if (enabled && reference) void verify()
  }, [enabled, reference, transactionId])

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    form.delete('email')
    const answers = Object.fromEntries(form)
    answers.weeklyHours = Number(answers.weeklyHours)
    for (const key of ['buyerAccess', 'siteAccess', 'operatingCoverage']) answers[key] = answers[key] === 'yes'
    return run(async () => {
      if (verified) {
        const result = await request({ action: 'report', reference, answers })
        setReport(result.report)
      } else {
        const result = await request({ action: 'checkout', email, answers })
        window.location.assign(result.checkoutUrl)
      }
    })
  }

  return (
    <div className="agri-quiz links-panel-content">
      <p>Explore agribusiness routes against your available capital, time, experience and goals. Get a personalised shortlist, the gaps to close and a practical validation step.</p>
      <p><strong>₦15,000 one-time payment</strong></p>
      {error && <p role="alert">{error}</p>}
      {!enabled && <p>Checkout is not open yet.</p>}
      {enabled && reference && !verified && (
        <div>
          {busy ? <p className="quiz-progress" role="status"><span aria-hidden="true" /> Confirming your payment and preparing report delivery…</p>
            : <button className="btn btn-primary" onClick={verify}>Check payment</button>}
          {error && <p><Link to="/links#quiz">Start a new assessment if you did not pay</Link></p>}
        </div>
      )}
      {enabled && (!reference || verified) && !report && (
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
          {!verified && <>
            <label>Email address <input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
            <p>Complete the assessment first. After Flutterwave verifies your payment, your report opens here and we send a copy to your email.</p>
          </>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : verified ? 'Get my report' : 'Pay ₦15,000 to unlock my report'}
          </button>
        </form>
      )}
      {report && (
        <section aria-labelledby="quiz-report">
          <h2 id="quiz-report">Your agribusiness fit report</h2>
          {emailed ? <p role="status">We sent a copy to the email you entered.</p> : (
            <p>Your report is ready here. If the email hasn’t arrived, check spam or{' '}
              <button type="button" disabled={busy} onClick={verify}>{busy ? 'Checking…' : 'check email delivery again'}</button>.
            </p>
          )}
          {report.overview && <p>{report.overview}</p>}
          <p><strong>Start here.</strong> {report.nextStep}</p>
          {report.shortlist.map(route => (
            <article key={route.id}>
              <h3>{route.name}</h3>
              <ul>{route.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
              <p><strong>First test.</strong> {route.nextStep}</p>
              {route.budgetCheck && <p><strong>Numbers to collect.</strong> {route.budgetCheck}</p>}
            </article>
          ))}
          {!!report.revisit.length && <h3>Routes to revisit after closing these gaps</h3>}
          {report.revisit.map(route => (
            <article key={route.id}>
              <h4>{route.name}</h4>
              <ul>{route.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>
            </article>
          ))}
          {!!report.plan?.length && <>
            <h3>Your first 90 days</h3>
            <ol>{report.plan.map(step => <li key={step.when}><strong>{step.when}.</strong> {step.action}</li>)}</ol>
          </>}
          <p>Check local costs, demand and operating requirements before committing capital. This assessment screens for business fit and does not estimate returns.</p>
        </section>
      )}
    </div>
  )
}

export default function AgriQuiz() {
  return (
    <main className="section links-page">
      <Link to="/links">← Obi Emeka links</Link>
      <h1>Know the Right Agricultural Business for You</h1>
      <AgriQuizForm />
    </main>
  )
}

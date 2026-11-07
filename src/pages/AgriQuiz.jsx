import React, { useEffect, useRef, useState } from 'react'
import { openFlutterwaveCheckout } from '../lib/flutterwaveCheckout'
import { Link, useSearchParams } from 'react-router-dom'

const fields = [
  ['goal', 'What do you most want the business to do?', {
    cashflow: 'Generate operating cash flow', buildBusiness: 'Build a business I can scale', legacy: 'Build a long-term family asset',
  }],
  ['role', 'What role will you take?', {
    operator: 'Run the business myself', partner: 'Operate alongside a partner', passive: 'Provide capital with limited involvement', landPartner: 'Contribute land and work with an operator',
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
    processing: 'Food processing or manufacturing', livestock: 'Livestock or fish farming',
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
  const [params, setParams] = useSearchParams()
  const reference = params.get(inline ? 'quiz_order' : 'order')
  const transactionId = params.get('transaction_id')
  const [verified, setVerified] = useState(false)
  const [report, setReport] = useState(null)
  const [emailed, setEmailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [processingProduct, setProcessingProduct] = useState('')
  const [preparing, setPreparing] = useState(false)
  const [checkout, setCheckout] = useState(null)
  const readyHeading = useRef(null)
  const progressMessage = useRef(null)

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
    if (reference) void verify()
  }, [reference, transactionId])

  useEffect(() => {
    if (preparing) progressMessage.current?.focus()
    else if (checkout) readyHeading.current?.focus()
  }, [checkout, preparing])

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    form.delete('email')
    const answers = Object.fromEntries(form)
    const { budgetCurrency, availableCapital, setupCost, workingCapital } = answers
    for (const key of ['budgetCurrency', 'availableCapital', 'setupCost', 'workingCapital']) delete answers[key]
    if (availableCapital !== '') {
      answers.budget = {
        currency: budgetCurrency, available: Number(availableCapital),
        setup: setupCost === '' ? null : Number(setupCost),
        working: workingCapital === '' ? null : Number(workingCapital),
      }
    }
    answers.weeklyHours = Number(answers.weeklyHours)
    for (const key of ['buyerAccess', 'siteAccess', 'operatingCoverage']) answers[key] = answers[key] === 'yes'
    if (answers.processingProduct) answers.feedstockAccess = answers.feedstockAccess === 'yes'
    return run(async () => {
      if (verified) {
        const result = await request({ action: 'report', reference, answers })
        setReport(result.report)
      } else {
        setPreparing(true)
        try {
          const [prepared] = await Promise.all([
            request({ action: 'checkout', email, answers }),
            new Promise(resolve => window.setTimeout(resolve, 3000)),
          ])
          setCheckout(prepared)
        } finally {
          setPreparing(false)
        }
      }
    })
  }

  function pay() {
    return run(async () => {
      const payment = await openFlutterwaveCheckout(checkout)
      if (payment) {
        const next = new URLSearchParams(params)
        next.set(inline ? 'quiz_order' : 'order', checkout.reference)
        next.set('transaction_id', String(payment.transaction_id))
        setParams(next, { replace: true })
      }
    })
  }

  return (
    <div className="agri-quiz links-panel-content">
      <p>Explore agribusiness routes against your available capital, time, experience and goals. Get a personalised shortlist, the gaps to close and a practical validation step.</p>
      <p><strong>₦15,000 one-time payment</strong></p>
      {!reference && !preparing && !checkout && (
        <details className="quiz-sample">
          <summary>See a sample report excerpt</summary>
          <p><strong>Example: palm oil processing.</strong> This example uses fictional figures. The buyer has ₦3 million available and quotes of ₦2.5 million for setup and ₦1 million for working capital.</p>
          <p><strong>Budget finding.</strong> The proposed setup is ₦500,000 over budget before any cost increases. If costs rise by 10%, the gap grows to ₦850,000.</p>
          <p><strong>First 30 days.</strong> Verify seasonal fruit supply and obtain quotes from an existing mill. Ask a buyer to confirm grade and payment terms.</p>
          <p><strong>Days 31–60.</strong> Use a trial milling run to measure saleable oil per tonne and calculate costs after transport and losses.</p>
          <p><strong>Days 61–90.</strong> Compare the trial with the buyer’s price. Pause equipment purchases if fruit supply, extraction yield or waste handling remain unverified.</p>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
      {reference && !verified && (
        <div>
          {busy ? <p className="quiz-progress" role="status"><span aria-hidden="true" /> Confirming your payment and preparing report delivery…</p>
            : <button className="btn btn-primary" onClick={verify}>Check payment</button>}
          {error && <p><Link to="/links#quiz">Start a new assessment if you did not pay</Link></p>}
        </div>
      )}
      {preparing && (
        <p className="quiz-progress" role="status" tabIndex={-1} ref={progressMessage}>
          <span aria-hidden="true" /> Reviewing your answers and preparing your report…
        </p>
      )}
      {checkout && !reference && (
        <section className="form-card" aria-labelledby="quiz-ready">
          <h2 id="quiz-ready" tabIndex={-1} ref={readyHeading}>Your report is ready</h2>
          <p>Pay ₦15,000 once to see your personalised recommendations and action plan. We’ll also email you a copy after payment is confirmed.</p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={pay}>
            {busy ? 'Opening Flutterwave…' : 'Pay ₦15,000 to receive my report'}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setCheckout(null); setError('') }}>
            Edit my answers
          </button>
        </section>
      )}
      {(!reference || verified) && !report && (
        <div hidden={preparing || Boolean(checkout)}>
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
            <label>Which type of business are you most interested in?
              <select name="enterpriseInterest" defaultValue="">
                <option value="">I’m exploring my options</option>
                <option value="production">Crop production</option>
                <option value="perennial">Perennial crops or farm development</option>
                <option value="poultry">Poultry or eggs</option>
                <option value="livestock">Goats or sheep</option>
                <option value="aquaculture">Fish farming</option>
                <option value="nursery">Seedlings or planting materials</option>
                <option value="processing">Food processing or packaging</option>
                <option value="trade">Aggregation or distribution</option>
                <option value="export">Export supply</option>
                <option value="logistics">Storage, cold chain or transport</option>
                <option value="services">Agricultural services</option>
              </select>
            </label>
            <label>Where in Nigeria would the business operate? (optional)
              <input name="region" type="text" maxLength="60" placeholder="For example, Ondo State or Ibadan" />
            </label>
            <fieldset className="quiz-budget">
              <legend>Your budget</legend>
              <p>Use one currency throughout. Enter what you could commit after setting aside personal reserves. Rough amounts are fine.</p>
              <label>Currency <select name="budgetCurrency"><option value="NGN">Nigerian naira (NGN)</option><option value="USD">US dollars (USD)</option></select></label>
              <label>Capital available for the business
                <input type="number" name="availableCapital" min="0" max="1000000000000" step="1" required />
              </label>
              <p>If you already have estimates for your chosen business, enter both below. Leave both blank if you are still collecting quotes.</p>
              <label>One-time setup costs (optional)
                <input type="number" name="setupCost" min="0" max="1000000000000" step="1" />
              </label>
              <label>Working capital until buyers pay (optional)
                <input type="number" name="workingCapital" min="0" max="1000000000000" step="1" />
              </label>
            </fieldset>
            <label>Are you considering making a processed product?
              <select name="processingProduct" value={processingProduct} onChange={event => setProcessingProduct(event.target.value)}>
                <option value="">No or still exploring</option>
                <option value="plantainChips">Plantain chips</option>
                <option value="coconutOil">Coconut oil</option>
                <option value="palmOil">Palm oil</option>
                <option value="chocolate">Chocolate</option>
                <option value="cassava">Garri, cassava flour or other cassava products</option>
                <option value="grain">Rice or maize products</option>
                <option value="fruit">Dried fruit or spices</option>
                <option value="fish">Smoked or dried fish</option>
                <option value="other">Another processed product</option>
              </select>
            </label>
            {processingProduct && <>
              <label>How would you produce it?
                <select name="processingSetup" required defaultValue="">
                  <option value="" disabled>Choose an answer</option>
                  <option value="inHouse">In my own facility</option>
                  <option value="contract">I can access a contract processor</option>
                  <option value="undecided">I haven’t decided yet</option>
                </select>
              </label>
              <label>Can you source consistent raw materials at a price you can verify?
                <select name="feedstockAccess" required defaultValue="">
                  <option value="" disabled>Choose an answer</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </>}
            {!verified && <>
              <label>Email address <input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
              <p>We’ll use this email to send your report after payment.</p>
            </>}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Please wait…' : verified ? 'Get my report' : 'Submit My Answers'}
            </button>
          </form>
        </div>
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
          {!!report.capital?.length && <>
            <h3>Capital and cash needs</h3>
            <ul>{report.capital.map(line => <li key={line}>{line}</li>)}</ul>
          </>}
          <p><strong>Start here.</strong> {report.nextStep}</p>
          {report.shortlist.map(route => (
            <article key={route.id}>
              <h3>{route.name}</h3>
              <ul>{route.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
              <p><strong>First test.</strong> {route.nextStep}</p>
              {route.budgetCheck && <p><strong>Numbers to collect.</strong> {route.budgetCheck}</p>}
              {route.stop && <p><strong>When to pause.</strong> {route.stop}</p>}
            </article>
          ))}
          {!!report.revisit.length && <h3>Routes to revisit after closing these gaps</h3>}
          {report.revisit.map(route => (
            <article key={route.id}>
              <h4>{route.name}</h4>
              <ul>{route.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>
              {route.nextStep && <p><strong>How to recheck it.</strong> {route.nextStep}</p>}
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

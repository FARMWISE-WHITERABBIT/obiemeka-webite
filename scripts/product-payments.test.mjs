import test from 'node:test'
import assert from 'node:assert/strict'
import quiz from '../api/agri-quiz.js'
import submitBooking from '../api/submit-booking.js'
import { discoveryCreditToken } from '../api/_lib/discovery-credit.js'
import { expectedBookingAmount } from '../api/_lib/booking.js'
import webhook from '../api/flutterwave-webhook.js'
import innerCircle from '../api/inner-circle.js'

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
process.env.AGRI_QUIZ_ENABLED = 'true'
process.env.RESEND_API_KEY = 'test-only'
process.env.FLUTTERWAVE_SECRET_KEY = 'test-only'
process.env.FLUTTERWAVE_PUBLIC_KEY = 'test-public-key'
process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH = 'test-webhook-secret'
process.env.INNER_CIRCLE_ENABLED = 'true'
process.env.FLUTTERWAVE_INNER_CIRCLE_PLAN_ID = '1234'

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value },
    status(code) { this.code = code; return this },
    json(body) { this.body = body; return this },
    send(body) { this.body = body; return this },
  }
}
const json = data => Response.json(data)
const checkoutUrl = 'https://checkout.flutterwave.com/v3/hosted/pay/test'

test('Quiz verifies reference and amount before permitting a single saved report', async t => {
  let order
  let amount = 14999
  let emails = 0
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input)
    if (url.hostname === 'api.resend.com') {
      const email = JSON.parse(init.body)
      assert.equal(email.to, 'buyer@example.com')
      assert.match(email.text, /Buyer-led aggregation/)
      assert.match(email.text, /Days 61–90/)
      assert.equal(email.attachments[0].filename, 'obi-emeka-agribusiness-fit-report.pdf')
      assert.match(Buffer.from(email.attachments[0].content, 'base64').subarray(0, 8).toString(), /^%PDF-/)
      assert.equal(init.headers.get('Idempotency-Key'), 'agri-quiz-report/' + order.reference)
      emails++
      return json({ id: 'test-email' })
    }
    if (url.hostname === 'api.flutterwave.com') {
      if (url.pathname === '/v3/payments') {
        const payment = JSON.parse(init.body)
        assert.equal(payment.amount, 15000)
        assert.equal(payment.payment_plan, undefined)
        assert.match(payment.redirect_url, /\/links\?quiz_order=/)
        return json({ status: 'success', data: { link: checkoutUrl } })
      }
      return json({ status: 'success', data: { id: 321, status: 'successful',
        currency: 'NGN', amount, tx_ref: 'AGRI-QUIZ-' + order.reference } })
    }
    if (init.method === 'POST') { order = { ...JSON.parse(init.body), transaction_id: null }; return json([]) }
    if (init.method === 'PATCH') { Object.assign(order, JSON.parse(init.body)); return json([order]) }
    const access = url.searchParams.get('access_hash')
    return json(!access || access.endsWith(order.access_hash) ? [order] : [])
  })

  const answers = { goal: 'cashflow', role: 'operator', cashHorizon: 'short',
    capitalPosition: 'pilotOnly', skills: 'sales', weeklyHours: 12, buyerAccess: true,
    siteAccess: false, operatingCoverage: false, funding: 'ownFunds',
    lossTolerance: 'moderate', oversight: 'local' }
  const start = await quiz({ method: 'POST', headers: {}, body: { action: 'checkout', email: 'buyer@example.com', answers } }, response())
  assert.equal(start.body.checkoutUrl, checkoutUrl)
  assert.equal(start.body.reference, order.reference)
  assert.equal(start.body.inlineCheckout.public_key, 'test-public-key')
  assert.equal(start.body.inlineCheckout.amount, 15000)
  assert.equal(start.body.inlineCheckout.tx_ref, 'AGRI-QUIZ-' + order.reference)
  assert.equal(start.body.inlineCheckout.redirect_url, undefined)
  assert.match(start.headers['Set-Cookie'], /HttpOnly; Secure/)
  const call = (action, headers = {}, answers) => quiz({
    method: 'POST', headers, body: { action, reference: order.reference, transactionId: 321, answers },
  }, response())
  const headers = { cookie: start.headers['Set-Cookie'].split(';')[0] }
  assert.equal((await call('verify')).code, 403)
  assert.equal((await call('report', headers)).code, 403)
  assert.equal((await call('pdf', headers)).code, 403)
  const pending = await call('verify', headers)
  assert.equal(pending.code, 409)
  assert.equal(pending.body.report, undefined)
  assert.equal(pending.body.discoveryCredit, undefined)
  assert.equal(emails, 0)
  amount = 15000
  const event = {
    method: 'POST',
    headers: { 'verif-hash': 'test-webhook-secret' },
    body: { data: { tx_ref: 'AGRI-QUIZ-' + order.reference, id: 321 } },
  }
  assert.equal((await webhook(event, response())).code, 200)
  assert.equal((await webhook(event, response())).code, 200)
  const unlocked = await call('verify', headers)
  assert.equal(unlocked.code, 200)
  assert.equal(unlocked.body.emailed, true)
  assert.equal(unlocked.body.discoveryCredit.amount, 15000)
  const pdf = await call('pdf', headers)
  assert.equal(pdf.headers['Content-Type'], 'application/pdf')
  assert.match(pdf.body.subarray(0, 8).toString(), /^%PDF-/)
  assert.equal(emails, 1)
  assert.equal(unlocked.body.report.shortlist[0].id, 'trade')
  const completed = await call('report', headers, answers)
  assert.equal(completed.body.report.shortlist[0].id, 'trade')
  assert.deepEqual((await call('report', headers, {})).body, completed.body)
})

test('Inner Circle requires renewal consent and starts checkout on the configured monthly plan', async t => {
  let active = false
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input)
    if (url.pathname === '/v3/subscriptions') {
      assert.equal(url.searchParams.get('plan'), '1234')
      return json({ status: 'success', data: active ? [{ id: 1 }] : [] })
    }
    if (url.pathname === '/v3/payments') {
      const payment = JSON.parse(init.body)
      assert.equal(payment.payment_plan, 1234)
      assert.equal(payment.amount, 50000)
      assert.match(payment.redirect_url, /\/links\?inner_circle=returned/)
      assert.match(payment.tx_ref, /^INNER-CIRCLE-/)
      return json({ status: 'success', data: { link: checkoutUrl } })
    }
    if (url.pathname.endsWith('/green_circle_signups')) return json([{ email: 'member@example.com' }])
    return json([])
  })
  const call = consent => innerCircle({
    method: 'POST', body: { email: 'member@example.com', consent },
  }, response())
  assert.equal((await call(false)).code, 400)
  const checkout = (await call(true)).body
  assert.equal(checkout.checkoutUrl, checkoutUrl)
  assert.equal(checkout.inlineCheckout.payment_plan, 1234)
  assert.equal(checkout.inlineCheckout.amount, 50000)
  assert.equal(checkout.inlineCheckout.payment_options, 'card')
  active = true
  assert.equal((await call(true)).code, 409)
})


test('Discovery Call credit is paid-order and email bound, and creates one discounted checkout', async t => {
  const reference = '514deed9-bdaf-47c7-a737-1c627edc1003'
  const token = discoveryCreditToken(reference)
  let booking
  let paid = true
  let checkoutCount = 0
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input)
    if (url.hostname === 'api.flutterwave.com') {
      const payment = JSON.parse(init.body)
      assert.equal(payment.amount, 135000)
      checkoutCount++
      return json({ status: 'success', data: { link: checkoutUrl } })
    }
    if (url.pathname.endsWith('/agri_quiz_orders')) {
      return json([{ email: 'buyer@example.com', transaction_id: paid ? '123' : null, report: {} }])
    }
    if (init.method === 'HEAD') return new Response(null, { headers: { 'content-range': '*/0' } })
    if (init.method === 'POST') {
      booking = JSON.parse(init.body)
      return json(booking)
    }
    if (init.method === 'PATCH') {
      Object.assign(booking, JSON.parse(init.body))
      return json([])
    }
    return json(booking ? [booking] : [])
  })
  const fields = {
    name: 'Trial Buyer', email: 'buyer@example.com', org: 'Independent', session: 'discovery',
    topic: 'Quiz report', challenge: 'I would like help interpreting my agribusiness assessment.',
    discoveryCredit: { reference, token },
  }
  const book = (changes = {}) => submitBooking({
    method: 'POST', body: { ...fields, ...changes },
  }, response())
  assert.equal((await book({ email: 'other@example.com' })).code, 403)
  assert.equal((await book({ session: 'strategy' })).code, 400)
  paid = false
  assert.equal((await book()).code, 403)
  paid = true
  assert.equal((await book()).body.paymentUrl, checkoutUrl)
  assert.equal(expectedBookingAmount(booking), 135000)
  assert.equal(expectedBookingAmount({ session: 'discovery', amount: 135000 }), 150000)
  assert.equal((await book()).body.paymentUrl, checkoutUrl)
  assert.equal(checkoutCount, 1)
  booking.payment_status = 'paid'
  assert.equal((await book()).code, 409)
})

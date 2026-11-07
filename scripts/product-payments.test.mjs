import test from 'node:test'
import assert from 'node:assert/strict'
import quiz from '../api/agri-quiz.js'
import innerCircle from '../api/inner-circle.js'

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
process.env.AGRI_QUIZ_ENABLED = 'true'
process.env.INNER_CIRCLE_ENABLED = 'true'
process.env.FLUTTERWAVE_INNER_CIRCLE_PLAN_ID = '1234'

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value },
    status(code) { this.code = code; return this },
    json(body) { this.body = body; return this },
  }
}
const json = data => Response.json(data)
const checkoutUrl = 'https://checkout.flutterwave.com/v3/hosted/pay/test'

test('Quiz verifies reference and amount before permitting a single saved report', async t => {
  let order
  let amount = 14999
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input)
    if (url.hostname === 'api.flutterwave.com') {
      if (url.pathname === '/v3/payments') {
        const payment = JSON.parse(init.body)
        assert.equal(payment.amount, 15000)
        assert.equal(payment.payment_plan, undefined)
        return json({ status: 'success', data: { link: checkoutUrl } })
      }
      return json({ status: 'success', data: { id: 321, status: 'successful',
        currency: 'NGN', amount, tx_ref: 'AGRI-QUIZ-' + order.reference } })
    }
    if (init.method === 'POST') { order = { ...JSON.parse(init.body), transaction_id: null, report: null }; return json([]) }
    if (init.method === 'PATCH') { Object.assign(order, JSON.parse(init.body)); return json([order]) }
    return json(url.searchParams.get('access_hash')?.endsWith(order.access_hash) ? [order] : [])
  })

  const start = await quiz({ method: 'POST', headers: {}, body: { action: 'checkout', email: 'buyer@example.com' } }, response())
  assert.equal(start.body.checkoutUrl, checkoutUrl)
  assert.match(start.headers['Set-Cookie'], /HttpOnly; Secure/)
  const call = (action, headers = {}, answers) => quiz({
    method: 'POST', headers, body: { action, reference: order.reference, transactionId: 321, answers },
  }, response())
  const headers = { cookie: start.headers['Set-Cookie'].split(';')[0] }
  assert.equal((await call('verify')).code, 403)
  assert.equal((await call('report', headers)).code, 403)
  assert.equal((await call('verify', headers)).code, 409)
  amount = 15000
  assert.equal((await call('verify', headers)).code, 200)
  const answers = { goal: 'cashflow', role: 'operator', cashHorizon: 'short',
    capitalPosition: 'pilotOnly', skills: 'sales', weeklyHours: 12, buyerAccess: true,
    siteAccess: false, operatingCoverage: false, funding: 'ownFunds',
    lossTolerance: 'moderate', oversight: 'local' }
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
  assert.equal((await call(true)).body.checkoutUrl, checkoutUrl)
  active = true
  assert.equal((await call(true)).code, 409)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import submit from '../api/submit-green-circle.js'

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
process.env.RESEND_API_KEY = 'test-only'
process.env.NOTIFY_EMAIL = 'owner@example.com'
process.env.GREEN_CIRCLE_WHATSAPP_LINK = 'https://chat.whatsapp.com/test-invite'

test('Free signup emails both recipients and makes repeat submissions idempotent', async t => {
  let signup
  let rejectInvite = true
  const acceptedEmails = new Map()
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input)
    if (url.hostname === 'api.resend.com') {
      const email = JSON.parse(init.body)
      if (email.to === 'applicant@example.com' && rejectInvite) {
        return Response.json({ message: 'Test provider failure' }, { status: 422 })
      }
      acceptedEmails.set(init.headers.get('Idempotency-Key'), email)
      return Response.json({ id: 'email-test' })
    }
    if (init.method === 'HEAD') return new Response(null, { headers: { 'content-range': '*/0' } })
    if (init.method === 'POST') {
      signup = { ...JSON.parse(init.body), id: 'signup-1', status: 'pending' }
      return Response.json(signup)
    }
    if (init.method === 'PATCH') {
      Object.assign(signup, JSON.parse(init.body))
      return Response.json(signup)
    }
    return Response.json(signup ? [signup] : [])
  })
  const req = { method: 'POST', body: {
    name: 'Example Applicant', email: 'applicant@example.com', phone: '+2348012345678',
    memberType: 'agribusiness-owner', goal: 'Meet other agribusiness operators.\nLearn more about buyers & export.',
  } }
  const call = () => submit(req, {
    status(code) { this.code = code; return this },
    json(body) { return { status: this.code, body } },
  })

  assert.equal((await call()).status, 503)
  assert.equal(signup.status, 'pending')
  const notification = acceptedEmails.get('green-circle-signup/signup-1')
  assert.equal(notification.to, 'owner@example.com')
  assert.equal(notification.reply_to, 'applicant@example.com')
  for (const answer of ['Example Applicant', 'applicant@example.com', '+2348012345678',
    'Agribusiness owner / operator', 'Meet other agribusiness operators.', 'Learn more about buyers & export.']) {
    assert.ok(notification.text.includes(answer))
  }
  assert.match(notification.html, /operators\.<br>Learn more about buyers &amp; export\./)


  rejectInvite = false
  assert.equal((await call()).status, 200)
  assert.equal(signup.status, 'approved')
  const invite = acceptedEmails.get('green-circle-invite/signup-1')
  assert.equal(invite.to, 'applicant@example.com')
  assert.equal(invite.subject, 'Welcome to The Green Circle')
  assert.equal(invite.reply_to, 'owner@example.com')
  assert.match(invite.text, /Hi Example,/)
  assert.match(invite.text, /chat\.whatsapp\.com\/test-invite/)
  assert.match(invite.html, /chat\.whatsapp\.com\/test-invite/)
  assert.equal((await call()).status, 200)
  assert.equal(acceptedEmails.size, 2)
})

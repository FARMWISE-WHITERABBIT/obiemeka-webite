import { VALID_SESSIONS, SESSION_PRICING, getSupabase, sendBookingEmails } from './_lib/booking.js'

const MAX_LENGTHS = {
  name: 200, email: 200, org: 200, role: 200,
  topic: 200, timing: 200, challenge: 5000,
}

const EMAIL_RATE_LIMIT = { count: 3, windowMs: 60 * 60 * 1000 }   // 3 per email per hour
const GLOBAL_RATE_LIMIT = { count: 20, windowMs: 10 * 60 * 1000 } // 20 total per 10 min

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Parse body (Vercel passes it as a parsed object for JSON content-type)
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Malformed request body' })
  }

  // Honeypot: a hidden field real users never fill in. Bots that auto-fill every
  // input trip it — return a fake success so they don't retry with a smarter script.
  if ((body?.nickname || '').trim()) {
    return res.status(200).json({ ref: 'OE-' + Math.floor(100000 + Math.random() * 900000) })
  }

  // Trim all string inputs
  const name      = (body?.name      || '').trim()
  const email     = (body?.email     || '').trim()
  const org       = (body?.org       || '').trim()
  const role      = (body?.role      || '').trim()
  const session   = (body?.session   || '').trim()
  const topic     = (body?.topic     || '').trim()
  const challenge = (body?.challenge || '').trim()
  const timing    = (body?.timing    || '').trim()

  // Server-side validation
  const missing = ['name', 'email', 'org', 'session', 'topic', 'challenge'].filter(
    (k) => !{ name, email, org, session, topic, challenge }[k]
  )
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }
  if (!VALID_SESSIONS.includes(session)) {
    return res.status(400).json({ error: 'Invalid session type' })
  }
  if (challenge.length < 30) {
    return res.status(400).json({ error: 'Please describe your challenge in a few sentences' })
  }
  const tooLong = Object.entries(MAX_LENGTHS).find(
    ([k, max]) => ({ name, email, org, role, topic, timing, challenge })[k]?.length > max
  )
  if (tooLong) {
    return res.status(400).json({ error: `${tooLong[0]} is too long` })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars')
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  const supabase = getSupabase()

  // Rate limits: cap repeat submissions to the same email (stops using the form
  // to spam an arbitrary victim) and total submissions site-wide (stops floods).
  const emailWindowStart = new Date(Date.now() - EMAIL_RATE_LIMIT.windowMs).toISOString()
  const { count: emailCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', emailWindowStart)
  if ((emailCount ?? 0) >= EMAIL_RATE_LIMIT.count) {
    return res.status(429).json({ error: 'Too many requests for this email address. Please try again later.' })
  }

  const globalWindowStart = new Date(Date.now() - GLOBAL_RATE_LIMIT.windowMs).toISOString()
  const { count: globalCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', globalWindowStart)
  if ((globalCount ?? 0) >= GLOBAL_RATE_LIMIT.count) {
    return res.status(429).json({ error: 'Too many requests right now. Please try again in a few minutes.' })
  }

  const amount = SESSION_PRICING[session] || null

  // ref_num is unique in the DB; regenerate and retry on the rare collision
  // instead of hard-failing a valid submission.
  let ref, dbError, inserted
  for (let attempt = 0; attempt < 3; attempt++) {
    ref = 'OE-' + Math.floor(100000 + Math.random() * 900000)
    const { data, error } = await supabase.from('bookings').insert({
      ref_num:        ref,
      name,
      email,
      org,
      role:           role || null,
      session,
      topic,
      challenge,
      timing:         timing || 'Not specified',
      status:         'pending',
      payment_status: amount ? 'pending' : 'not_required',
      amount,
      currency:       amount ? 'NGN' : null,
    }).select().single()
    dbError = error
    inserted = data
    if (!dbError || dbError.code !== '23505') break
  }

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  // Sessions with a fixed price go through Flutterwave before they're confirmed —
  // hand the client a hosted checkout link instead of finishing the booking now.
  if (amount) {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      console.error('Missing FLUTTERWAVE_SECRET_KEY env var')
      await supabase.from('bookings').delete().eq('ref_num', ref)
      return res.status(500).json({ error: 'Payments are not configured yet. Please try again later.' })
    }

    const siteUrl = process.env.SITE_URL || 'https://obiemeka.com'
    let flwJson
    try {
      const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: ref,
          amount,
          currency: 'NGN',
          redirect_url: `${siteUrl}/api/verify-payment`,
          customer: { email, name },
          customizations: {
            title: `Obi Emeka — ${session}`,
            description: `Booking ${ref}`,
            logo: `${siteUrl}/assets/monogram-inverse.png`,
          },
          meta: { ref },
        }),
      })
      flwJson = await flwRes.json()
    } catch (err) {
      console.error('Flutterwave request failed:', err)
    }

    if (!flwJson || flwJson.status !== 'success' || !flwJson.data?.link) {
      console.error('Flutterwave payment init failed for', ref, flwJson)
      await supabase.from('bookings').delete().eq('ref_num', ref)
      return res.status(502).json({ error: 'Could not start payment. Please try again.' })
    }

    return res.status(200).json({ ref, paymentUrl: flwJson.data.link })
  }

  // No payment required (Retainer / Speaking) — confirm immediately, as before.
  await sendBookingEmails(inserted)
  return res.status(200).json({ ref })
}

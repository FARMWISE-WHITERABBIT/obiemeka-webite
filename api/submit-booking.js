import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SESSION_LABELS = {
  discovery:  'Discovery Call — ₦150,000 · 45 min',
  compliance: 'Compliance Audit Session — ₦400,000 · 2 hrs',
  strategy:   'Export Strategy Session — ₦750,000 · 5 hrs cumulative',
  investment: 'Agri-Investment Advisory Session — ₦600,000 · 3 hrs',
  retainer:   'Advisory Retainer — ₦850,000 / month',
  speaking:   'Speaking Engagement — Quote on request',
}

const VALID_SESSIONS = Object.keys(SESSION_LABELS)

const MAX_LENGTHS = {
  name: 200, email: 200, org: 200, role: 200,
  topic: 200, timing: 200, challenge: 5000,
}

const EMAIL_RATE_LIMIT = { count: 3, windowMs: 60 * 60 * 1000 }   // 3 per email per hour
const GLOBAL_RATE_LIMIT = { count: 20, windowMs: 10 * 60 * 1000 } // 20 total per 10 min

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

  // ── Supabase ─────────────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

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

  const submittedAt = new Date().toUTCString()

  // ref_num is unique in the DB; regenerate and retry on the rare collision
  // instead of hard-failing a valid submission.
  let ref, dbError
  for (let attempt = 0; attempt < 3; attempt++) {
    ref = 'OE-' + Math.floor(100000 + Math.random() * 900000)
    const { error } = await supabase.from('bookings').insert({
      ref_num:   ref,
      name,
      email,
      org,
      role:      role || null,
      session,
      topic,
      challenge,
      timing:    timing || 'Not specified',
      status:    'pending',
    })
    dbError = error
    if (!dbError || dbError.code !== '23505') break
  }

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  // ── Resend emails ─────────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromAddr = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const notifyTo = process.env.NOTIFY_EMAIL || 'oe@obiemeka.com'

    const [notifyResult, confirmResult] = await Promise.allSettled([
      resend.emails.send({
        from:    `Obi Emeka Website <${fromAddr}>`,
        to:      notifyTo,
        subject: `[${ref}] New ${SESSION_LABELS[session] ?? session} from ${name}`,
        html:    notificationHtml({ ref, name, email, org, role, session, topic, challenge, timing, submittedAt }),
      }),
      resend.emails.send({
        from:    `Obi Emeka <${fromAddr}>`,
        to:      email,
        subject: `Got it, ${name.split(' ')[0]}. Your brief is in. [${ref}]`,
        html:    confirmationHtml({ ref, name, session, topic, timing }),
      }),
    ])
    if (notifyResult.status === 'rejected') {
      console.error(`Notification email failed for booking ${ref}:`, notifyResult.reason)
    }
    if (confirmResult.status === 'rejected') {
      console.error(`Confirmation email failed for booking ${ref}:`, confirmResult.reason)
    }
  }

  return res.status(200).json({ ref })
}

// ── Email templates ───────────────────────────────────────────────────────────
// Minimal, brand-consistent plain HTML — renders well in all email clients.

function notificationHtml({ ref, name, email, org, role, session, topic, challenge, timing, submittedAt }) {
  const rows = [
    ['Ref',       ref],
    ['Name',      escapeHtml(name)],
    ['Email',     escapeHtml(email)],
    ['Org',       escapeHtml(org) || '—'],
    ['Role',      escapeHtml(role) || '—'],
    ['Session',   escapeHtml(SESSION_LABELS[session] ?? session)],
    ['Topic',     escapeHtml(topic)],
    ['Timing',    escapeHtml(timing) || '—'],
    ['Submitted', submittedAt],
  ]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>New booking request</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:system-ui,sans-serif;color:#F6F4EF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:40px auto;">
    <tr><td style="padding:0 24px;">
      <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6660;margin:0 0 32px;">
        — obiemeka.com / New request
      </p>
      <h1 style="font-size:36px;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px;line-height:1;">
        New booking<br>
        <span style="color:#E8FF3A;">request.</span>
      </h1>
      <p style="color:#6B6660;font-size:15px;margin:0 0 32px;">
        Someone filled out the booking brief on obiemeka.com.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid rgba(246,244,239,0.1);border-radius:12px;overflow:hidden;margin-bottom:32px;">
        ${rows.map(([k, v], i) => `
        <tr style="background:${i % 2 === 0 ? 'rgba(246,244,239,0.04)' : 'transparent'};">
          <td style="padding:12px 16px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
                     color:#6B6660;white-space:nowrap;width:120px;">${k}</td>
          <td style="padding:12px 16px;font-size:14px;color:#F6F4EF;">${v}</td>
        </tr>`).join('')}
      </table>

      <div style="background:rgba(246,244,239,0.06);border:1px solid rgba(246,244,239,0.1);
                  border-radius:12px;padding:20px 24px;margin-bottom:32px;">
        <p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6660;margin:0 0 12px;">
          — The challenge
        </p>
        <p style="font-size:15px;line-height:1.6;color:#F6F4EF;margin:0;">${escapeHtml(challenge).replace(/\n/g, '<br>')}</p>
      </div>

      <p style="font-size:13px;color:#6B6660;border-top:1px solid rgba(246,244,239,0.1);padding-top:24px;margin:0;">
        Reply directly to <a href="mailto:${escapeHtml(email)}" style="color:#E8FF3A;">${escapeHtml(email)}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`
}

function confirmationHtml({ ref, name, session, topic, timing }) {
  const firstName = escapeHtml(name.split(' ')[0])
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brief received</title></head>
<body style="margin:0;padding:0;background:#F6F4EF;font-family:system-ui,sans-serif;color:#0A0A0A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:40px auto;">
    <tr><td style="padding:0 24px;">
      <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6660;margin:0 0 32px;">
        — Obi Emeka · obiemeka.com
      </p>
      <h1 style="font-size:36px;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px;line-height:1;">
        Got it,<br>
        <span style="color:#0A0A0A;">${firstName}.</span>
      </h1>
      <p style="color:#6B6660;font-size:16px;line-height:1.6;margin:0 0 32px;">
        Your brief is in. I read every one personally. Expect a reply within
        48 hours on weekdays — sooner if the brief is clear and the fit is obvious.
      </p>

      <div style="background:#0A0A0A;color:#F6F4EF;border-radius:12px;padding:24px;margin-bottom:32px;">
        <p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;
                  color:rgba(246,244,239,0.5);margin:0 0 16px;">— Your booking receipt</p>
        ${[
          ['Ref',     ref],
          ['Session', escapeHtml(SESSION_LABELS[session] ?? session)],
          ['Topic',   escapeHtml(topic)],
          ['Timing',  escapeHtml(timing) || '—'],
          ['Status',  'Pending review'],
        ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;
                    border-bottom:1px solid rgba(246,244,239,0.08);">
          <span style="font-size:12px;letter-spacing:0.1em;color:rgba(246,244,239,0.5);">${k}</span>
          <span style="font-size:13px;color:#F6F4EF;text-align:right;max-width:60%;">${v}</span>
        </div>`).join('')}
      </div>

      <p style="font-size:14px;color:#6B6660;line-height:1.6;margin:0 0 8px;">
        If you have anything to add, reply to this email — it goes straight to my inbox.
      </p>
      <p style="font-size:14px;color:#6B6660;margin:0;">
        — Obi
      </p>

      <p style="font-size:12px;color:#6B6660;border-top:1px solid rgba(10,10,10,0.1);
                padding-top:24px;margin:32px 0 0;">
        <a href="https://obiemeka.com" style="color:#0A0A0A;">obiemeka.com</a>
        &nbsp;·&nbsp; oe@obiemeka.com
      </p>
    </td></tr>
  </table>
</body>
</html>`
}

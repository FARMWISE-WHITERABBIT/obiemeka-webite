import crypto from 'node:crypto'
import { Resend } from 'resend'
import { getSupabase, escapeHtml } from './_lib/booking.js'

const MAX_LENGTHS = { name: 200, email: 200, phone: 40, utm_source: 100, utm_medium: 100, utm_campaign: 100, utm_content: 100, landingPath: 300, referrer: 500 }

const EMAIL_RATE_LIMIT = { count: 3, windowMs: 60 * 60 * 1000 }   // 3 per email per hour
const GLOBAL_RATE_LIMIT = { count: 30, windowMs: 10 * 60 * 1000 } // 30 total per 10 min

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Malformed request body' })
  }

  // Honeypot — same pattern as /api/submit-booking.
  if ((body?.nickname || '').trim()) {
    return res.status(200).json({ ok: true })
  }

  const name        = (body?.name        || '').trim()
  const email       = (body?.email       || '').trim().toLowerCase()
  const phone       = (body?.phone       || '').trim()
  const utm_source  = (body?.utm_source  || '').trim()
  const utm_medium  = (body?.utm_medium  || '').trim()
  const utm_campaign= (body?.utm_campaign|| '').trim()
  const utm_content = (body?.utm_content || '').trim()
  const landingPath = (body?.landingPath || '').trim()
  const referrer    = (body?.referrer    || '').trim()

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }
  const tooLong = Object.entries(MAX_LENGTHS).find(
    ([k, max]) => ({ name, email, phone, utm_source, utm_medium, utm_campaign, utm_content, landingPath, referrer })[k]?.length > max
  )
  if (tooLong) {
    return res.status(400).json({ error: `${tooLong[0]} is too long` })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars')
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  const supabase = getSupabase()

  const emailWindowStart = new Date(Date.now() - EMAIL_RATE_LIMIT.windowMs).toISOString()
  const { count: emailCount } = await supabase
    .from('green_circle_signups')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', emailWindowStart)
  if ((emailCount ?? 0) >= EMAIL_RATE_LIMIT.count) {
    return res.status(429).json({ error: 'Too many requests for this email address. Please try again later.' })
  }

  const globalWindowStart = new Date(Date.now() - GLOBAL_RATE_LIMIT.windowMs).toISOString()
  const { count: globalCount } = await supabase
    .from('green_circle_signups')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', globalWindowStart)
  if ((globalCount ?? 0) >= GLOBAL_RATE_LIMIT.count) {
    return res.status(429).json({ error: 'Too many requests right now. Please try again in a few minutes.' })
  }

  // Person is in the database the moment they submit, independent of whether
  // they're approved. A repeat signup with the same email refreshes their
  // attribution/contact fields but never touches status or approval_token —
  // resubmitting can't reset an already-reviewed application back to pending,
  // and won't invalidate an approve link already sent to Obi.
  const attributionFields = {
    name,
    phone: phone || null,
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
    utm_content: utm_content || null,
    landing_path: landingPath || null,
    referrer: referrer || null,
  }

  const { data: existing } = await supabase
    .from('green_circle_signups')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let signup, dbError
  if (existing) {
    const { data, error } = await supabase
      .from('green_circle_signups')
      .update(attributionFields)
      .eq('email', email)
      .select()
      .single()
    signup = data; dbError = error
  } else {
    const { data, error } = await supabase
      .from('green_circle_signups')
      .insert({ ...attributionFields, email, approval_token: crypto.randomBytes(24).toString('hex') })
      .select()
      .single()
    signup = data; dbError = error
  }

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  await sendAdminNotification(signup)
  return res.status(200).json({ ok: true })
}

async function sendAdminNotification(signup) {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddr = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  const notifyTo = process.env.NOTIFY_EMAIL || 'oe@obiemeka.com'
  const siteUrl = process.env.SITE_URL || 'https://obiemeka.com'
  const { id, name, email, phone, utm_source, utm_medium, utm_campaign, approval_token, created_at } = signup
  const submittedAt = new Date(created_at || Date.now()).toUTCString()
  const approveUrl = `${siteUrl}/api/approve-green-circle?id=${id}&token=${approval_token}&action=approve`
  const declineUrl = `${siteUrl}/api/approve-green-circle?id=${id}&token=${approval_token}&action=decline`

  try {
    await resend.emails.send({
      from:    `Obi Emeka Website <${fromAddr}>`,
      to:      notifyTo,
      subject: `Review: new Green Circle signup from ${name}`,
      html:    notificationHtml({ name, email, phone, utm_source, utm_medium, utm_campaign, submittedAt, approveUrl, declineUrl }),
    })
  } catch (err) {
    console.error('Green Circle admin notification failed:', err)
  }
}

function notificationHtml({ name, email, phone, utm_source, utm_medium, utm_campaign, submittedAt, approveUrl, declineUrl }) {
  const rows = [
    ['Name', escapeHtml(name)],
    ['Email', escapeHtml(email)],
    ['Phone', escapeHtml(phone) || '—'],
    ['Source', escapeHtml(utm_source) || '—'],
    ['Medium', escapeHtml(utm_medium) || '—'],
    ['Campaign', escapeHtml(utm_campaign) || '—'],
    ['Submitted', submittedAt],
  ]
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:system-ui,sans-serif;color:#F6F4EF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:40px auto;">
    <tr><td style="padding:0 24px;">
      <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6660;margin:0 0 32px;">
        — obiemeka.com / Green Circle
      </p>
      <h1 style="font-size:36px;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px;line-height:1;">
        Review this signup.
      </h1>
      <p style="color:#6B6660;font-size:15px;margin:0 0 24px;">
        Approving emails them the WhatsApp invite immediately. Declining sends nothing — they're just left off the list.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr>
          <td style="border-radius:999px;background:#E8FF3A;padding-right:12px;">
            <a href="${approveUrl}"
               style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;
                      color:#0A0A0A;text-decoration:none;border-radius:999px;">
              Approve &rarr;
            </a>
          </td>
          <td style="border-radius:999px;border:1px solid rgba(246,244,239,0.25);">
            <a href="${declineUrl}"
               style="display:inline-block;padding:13px 27px;font-size:15px;font-weight:600;
                      color:#F6F4EF;text-decoration:none;border-radius:999px;">
              Decline
            </a>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid rgba(246,244,239,0.1);border-radius:12px;overflow:hidden;margin-bottom:32px;">
        ${rows.map(([k, v], i) => `
        <tr style="background:${i % 2 === 0 ? 'rgba(246,244,239,0.04)' : 'transparent'};">
          <td style="padding:12px 16px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
                     color:#6B6660;white-space:nowrap;width:110px;">${k}</td>
          <td style="padding:12px 16px;font-size:14px;color:#F6F4EF;">${v}</td>
        </tr>`).join('')}
      </table>

      <p style="font-size:13px;color:#6B6660;border-top:1px solid rgba(246,244,239,0.1);padding-top:24px;margin:0;">
        Reply directly to <a href="mailto:${escapeHtml(email)}" style="color:#E8FF3A;">${escapeHtml(email)}</a>
      </p>
    </td></tr>
  </table>
</body></html>`
}

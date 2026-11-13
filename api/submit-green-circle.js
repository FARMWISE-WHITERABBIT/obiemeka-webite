import { sendInviteEmail } from './_lib/green-circle-invite.js'
import { isPhoneNumber } from '../src/lib/phoneNumber.js'
import crypto from 'node:crypto'
import { Resend } from 'resend'
import { getSupabase, escapeHtml } from './_lib/booking.js'

const MAX_LENGTHS = { name: 200, email: 200, phone: 40, memberType: 40, goal: 1000, utm_source: 100, utm_medium: 100, utm_campaign: 100, utm_content: 100, landingPath: 300, referrer: 500 }

const VALID_MEMBER_TYPES = [
  'diaspora-investor', 'nigeria-investor', 'agribusiness-owner',
  'agritech-founder', 'agritech-enthusiast', 'ag-professional', 'other',
]

const MEMBER_TYPE_LABELS = {
  'diaspora-investor': 'Diaspora investor',
  'nigeria-investor': 'Nigeria-based investor',
  'agribusiness-owner': 'Agribusiness owner / operator',
  'agritech-founder': 'Agri-tech startup founder',
  'agritech-enthusiast': 'Agri-tech enthusiast',
  'ag-professional': 'Agricultural professional / consultant',
  'other': 'Other',
}

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
  const phone       = (typeof body?.phone === 'string' ? body.phone : '').trim()
  const memberType  = (body?.memberType  || '').trim()
  const goal        = (body?.goal        || '').trim()
  const utm_source  = (body?.utm_source  || '').trim()
  const utm_medium  = (body?.utm_medium  || '').trim()
  const utm_campaign= (body?.utm_campaign|| '').trim()
  const utm_content = (body?.utm_content || '').trim()
  const landingPath = (body?.landingPath || '').trim()
  const referrer    = (body?.referrer    || '').trim()

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }
  if (!isPhoneNumber(phone)) {
    return res.status(400).json({ error: 'A valid WhatsApp number is required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }
  if (!VALID_MEMBER_TYPES.includes(memberType)) {
    return res.status(400).json({ error: 'Please select which of these you are' })
  }
  if (goal.length < 15) {
    return res.status(400).json({ error: 'Please say a bit more about what you\'re hoping to get out of it' })
  }
  const tooLong = Object.entries(MAX_LENGTHS).find(
    ([k, max]) => ({ name, email, phone, memberType, goal, utm_source, utm_medium, utm_campaign, utm_content, landingPath, referrer })[k]?.length > max
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

  const attributionFields = {
    name,
    phone,
    member_type: memberType,
    goal,
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
    utm_content: utm_content || null,
    landing_path: landingPath || null,
    referrer: referrer || null,
  }

  const { data: existing, error: lookupError } = await supabase
    .from('green_circle_signups')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (lookupError) {
    return res.status(503).json({ error: 'Could not check your signup. Please try again.' })
  }
  if (existing?.status === 'approved') return res.status(200).json({ ok: true })
  if (existing?.status === 'declined') {
    return res.status(409).json({ error: 'Please contact us about your previous Green Circle signup.' })
  }

  let signup, dbError
  if (existing) {
    const { data, error } = await supabase
      .from('green_circle_signups')
      .update(attributionFields)
      .eq('email', email)
      .eq('status', 'pending')
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

  const notified = await sendAdminNotification(signup)
  if (!notified) {
    return res.status(503).json({ error: 'Your details were saved, but we couldn’t finish sending the signup emails. Please try again shortly.' })
  }

  if (!await sendInviteEmail(signup)) {
    return res.status(503).json({ error: 'Your details were saved, but we couldn’t send your WhatsApp invite. Please try again shortly.' })
  }

  // "Approved" is the existing status for someone invited to the free group.
  // Preserve it for Inner Circle eligibility without adding a review step.
  const { data: approved, error: statusError } = await supabase.from('green_circle_signups')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', signup.id).eq('status', 'pending').select('id').maybeSingle()
  if (statusError) {
    return res.status(503).json({ error: 'Your invite was sent, but we couldn’t finish saving your signup. Please try again shortly.' })
  }
  return res.status(200).json({ ok: true, leadCreated: Boolean(approved) })
}

async function sendAdminNotification(signup) {
  if (!process.env.RESEND_API_KEY) return false

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddr = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  const notifyTo = process.env.NOTIFY_EMAIL || 'oe@obiemeka.com'
  const { id, name, email, phone, member_type, goal, utm_source, utm_medium, utm_campaign, created_at } = signup
  const submittedAt = new Date(created_at || Date.now()).toUTCString()
  const answers = [
    ['Full name', name],
    ['Email', email],
    ['WhatsApp number', phone],
    ['Which of these are you?', MEMBER_TYPE_LABELS[member_type] || member_type],
    ['What are you hoping to get out of it?', goal],
  ]
  const signupDetails = [
    ['Source', utm_source],
    ['Medium', utm_medium],
    ['Campaign', utm_campaign],
    ['Submitted', submittedAt],
  ]

  try {
    const { error } = await resend.emails.send({
      from:    `Obi Emeka Website <${fromAddr}>`,
      to:      notifyTo,
      subject: `New Green Circle signup: ${name}`,
      replyTo: email,
      text: [
        'Someone signed up for The Green Circle.', '',
        ...answers.map(([label, value]) => label + ': ' + value),
        '', 'Signup details', ...signupDetails.map(([label, value]) => label + ': ' + (value || '—')),
      ].join('\n'),
      html: notificationHtml(answers, signupDetails),
    }, { idempotencyKey: `green-circle-signup/${id}` })
    if (error) throw error
    return true
  } catch (err) {
    console.error('Green Circle admin notification failed:', err)
    return false
  }
}

function notificationHtml(answers, signupDetails) {
  const rows = fields => fields.map(([label, value]) => `
    <tr><td style="padding:10px 0;border-top:1px solid #DCE6DD;">
      <p style="margin:0 0 4px;color:#315640;font-weight:bold;font-size:13px;">${escapeHtml(label)}</p>
      <p style="margin:0;color:#202B24;font-size:15px;line-height:1.5;overflow-wrap:anywhere;">${escapeHtml(value || '—').replace(/\n/g, '<br>')}</p>
    </td></tr>`).join('')
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#F3F4ED;font-family:Arial,sans-serif;color:#202B24;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#FFFFFF;border:1px solid #D0DED2;border-radius:16px;">
        <tr><td style="padding:24px;">
          <p style="margin:0 0 8px;color:#315640;font-size:11px;font-weight:bold;letter-spacing:2px;">THE GREEN CIRCLE</p>
          <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:28px;">New free community signup</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Here’s everything they entered. Use their WhatsApp number if you need to follow up, or reply to this email to contact them.</p>
          <h2 style="margin:0 0 8px;font-size:17px;">Form answers</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows(answers)}</table>
          <h2 style="margin:14px 0 8px;font-size:17px;">Signup details</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows(signupDetails)}</table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

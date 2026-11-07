import { Resend } from 'resend'
import { escapeHtml } from './booking.js'

export async function sendInviteEmail(signup) {
  const whatsappLink = process.env.GREEN_CIRCLE_WHATSAPP_LINK || ''
  if (!process.env.RESEND_API_KEY || !whatsappLink) {
    if (!whatsappLink) console.error('GREEN_CIRCLE_WHATSAPP_LINK not set — approved signup was not emailed an invite')
    return false
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddr = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  const firstName = (signup.name || '').trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,'

  try {
    const { error } = await resend.emails.send({
      from:    `Obi Emeka <${fromAddr}>`,
      to:      signup.email,
      subject: 'Welcome to The Green Circle',
      replyTo: process.env.NOTIFY_EMAIL || 'oe@obiemeka.com',
      text: [
        greeting, '', 'Thanks for signing up for The Green Circle.',
        'It’s a free WhatsApp community for people working in or exploring African agriculture.',
        '', 'Join The Green Circle on WhatsApp: ' + whatsappLink,
        '', 'When you join, introduce yourself and tell us what you’re working on or hoping to learn.',
        'If the link gives you any trouble, reply to this email and we’ll help.', '', 'See you there,', 'Obi Emeka',
      ].join('\n'),
      html: inviteHtml({ greeting, whatsappLink }),
    }, { idempotencyKey: `green-circle-invite/${signup.id}` })
    if (error) throw error
    return true
  } catch (err) {
    console.error('Green Circle invite email failed:', err)
    return false
  }
}

function inviteHtml({ greeting, whatsappLink }) {
  const safeLink = escapeHtml(whatsappLink)
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#F3F4ED;font-family:Arial,sans-serif;color:#202B24;">
  <div style="display:none;max-height:0;overflow:hidden;">Your invite to the free Green Circle WhatsApp community.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F4ED;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#FFFFFF;border:1px solid #D0DED2;border-radius:16px;">
        <tr><td style="padding:26px 24px;background:#244B36;color:#FFFFFF;border-radius:15px 15px 0 0;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:2px;">OBI EMEKA</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;line-height:1.2;">Welcome to The Green Circle</h1>
        </td></tr>
        <tr><td style="padding:24px;font-size:16px;line-height:1.6;">
          <p style="margin:0 0 12px;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 16px;">Thanks for signing up. The Green Circle is a free WhatsApp community for people working in or exploring African agriculture. You’ll meet others in the sector and hear about learning sessions, meetups and opportunities.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
            <tr><td style="background:#244B36;border-radius:8px;">
              <a href="${safeLink}" style="display:inline-block;padding:13px 18px;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;">Join The Green Circle on WhatsApp</a>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;">When you join, introduce yourself and tell us what you’re working on or hoping to learn.</p>
          <p style="margin:0 0 16px;">If the button doesn’t work, <a href="${safeLink}" style="color:#244B36;text-decoration:underline;">open the WhatsApp invite here</a> or reply to this email and we’ll help.</p>
          <p style="margin:0;">See you there,<br><strong>Obi Emeka</strong></p>
        </td></tr>
        <tr><td style="padding:14px 24px;border-top:1px solid #D0DED2;color:#526558;font-size:12px;">
          You’re receiving this because you signed up for The Green Circle on <a href="https://obiemeka.com" style="color:#244B36;">obiemeka.com</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

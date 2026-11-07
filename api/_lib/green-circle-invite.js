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

  try {
    const { error } = await resend.emails.send({
      from:    `Obi Emeka <${fromAddr}>`,
      to:      signup.email,
      subject: 'Your Green Circle WhatsApp invite',
      html:    inviteHtml({ name: signup.name, whatsappLink }),
    }, { idempotencyKey: `green-circle-invite/${signup.id}` })
    if (error) throw error
    return true
  } catch (err) {
    console.error('Green Circle invite email failed:', err)
    return false
  }
}

function inviteHtml({ name, whatsappLink }) {
  const firstName = escapeHtml((name || '').split(' ')[0])
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F6F4EF;font-family:system-ui,sans-serif;color:#0A0A0A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:40px auto;">
    <tr><td style="padding:0 24px;">
      <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6660;margin:0 0 32px;">
        — Obi Emeka · The Green Circle
      </p>
      <h1 style="font-size:36px;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px;line-height:1;">
        You're in, ${firstName}.
      </h1>
      <p style="color:#6B6660;font-size:16px;line-height:1.6;margin:0 0 32px;">
        Tap below to join the WhatsApp Community — this is where The Green
        Circle actually lives, not your inbox.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr><td style="border-radius:999px;background:#0A0A0A;">
          <a href="${escapeHtml(whatsappLink)}"
             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;
                    color:#E8FF3A;text-decoration:none;border-radius:999px;">
            Join the WhatsApp Community &rarr;
          </a>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#6B6660;border-top:1px solid rgba(10,10,10,0.1);
                padding-top:24px;margin:32px 0 0;">
        <a href="https://obiemeka.com" style="color:#0A0A0A;">obiemeka.com</a>
      </p>
    </td></tr>
  </table>
</body></html>`
}


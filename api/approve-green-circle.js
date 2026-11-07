import { sendInviteEmail } from './_lib/green-circle-invite.js'
import { getSupabase, escapeHtml } from './_lib/booking.js'

// Approve/decline for a Green Circle signup, reached from the "Approve" /
// "Decline" buttons in the admin notification email
// (api/submit-green-circle.js). approval_token is a 48-char random hex
// value generated per-signup, so this can't be guessed or driven by anyone
// who isn't the person who received that email.
//
// GET must stay side-effect-free: it only renders a confirm page. Corporate
// email security scanners (Microsoft Safe Links, Proofpoint, etc.)
// automatically fetch every link in an inbound email to check it for
// malware — if GET mutated state directly, those scanners would silently
// auto-approve or auto-decline signups before a human ever opened the
// email. The actual status change only happens on the POST the confirm
// button submits, which only a real click in a real browser can trigger.
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).send(htmlPage('Method not allowed', 'This link only works from the email.'))
  }

  const { id, token, action } = req.query
  if (!id || !token || (action !== 'approve' && action !== 'decline')) {
    return res.status(400).send(htmlPage('Bad link', 'This approval link is missing required parameters.'))
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars')
    return res.status(500).send(htmlPage('Not configured', 'Supabase is not configured on this deployment.'))
  }

  const supabase = getSupabase()
  const { data: signup, error } = await supabase
    .from('green_circle_signups')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Approval lookup failed:', error)
    return res.status(500).send(htmlPage('Error', 'Could not look up this signup. Please try again.'))
  }
  if (!signup) {
    return res.status(404).send(htmlPage('Not found', "Couldn't find that signup — it may have been removed."))
  }
  if (signup.approval_token !== token) {
    return res.status(403).send(htmlPage('Invalid link', "This approval link doesn't match our records."))
  }

  if (signup.status !== 'pending') {
    return res.status(200).send(htmlPage(
      `Already ${signup.status}`,
      `${escapeHtml(signup.name)} (${escapeHtml(signup.email)}) was already marked ${escapeHtml(signup.status)}${
        signup.approved_at ? ' on ' + new Date(signup.approved_at).toUTCString() : ''
      }.`
    ))
  }

  if (req.method === 'GET') {
    return res.status(200).send(confirmPage({ signup, action, id, token }))
  }

  const newStatus = action === 'approve' ? 'approved' : 'declined'
  if (newStatus === 'approved' && (!process.env.RESEND_API_KEY || !process.env.GREEN_CIRCLE_WHATSAPP_LINK)) {
    return res.status(503).send(htmlPage('Invite email is unavailable', 'The invite link or email service is not configured. This signup is still pending.'))
  }

  // The .eq('status', 'pending') guard makes this safe against a double
  // submit or two people opening the same email: only the request that
  // actually flips a pending row gets rows back and sends the invite.
  const { data: updated, error: updateError } = await supabase
    .from('green_circle_signups')
    .update({ status: newStatus, approved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .maybeSingle()

  if (updateError) {
    console.error('Approval update failed:', updateError)
    return res.status(500).send(htmlPage('Error', 'Could not update this signup. Please try again.'))
  }
  if (!updated) {
    return res.status(200).send(htmlPage('Already handled', 'This signup was just reviewed a moment ago (probably a double submit) — no change made.'))
  }

  if (newStatus === 'approved') {
    const sent = await sendInviteEmail(updated)
    if (!sent) {
      return res.status(502).send(htmlPage('Approved, email not sent',
        'The signup was approved, but the email provider did not accept the invite. Send the WhatsApp invite manually.'))
    }
  }

  return res.status(200).send(htmlPage(
    newStatus === 'approved' ? 'Approved' : 'Declined',
    newStatus === 'approved'
      ? `${escapeHtml(updated.name)} (${escapeHtml(updated.email)}) has been approved and emailed the WhatsApp invite.`
      : `${escapeHtml(updated.name)} (${escapeHtml(updated.email)}) has been marked declined. No email was sent to them.`
  ))
}

function confirmPage({ signup, action, id, token }) {
  const verb = action === 'approve' ? 'Approve' : 'Decline'
  const consequence = action === 'approve'
    ? 'They will immediately be emailed the WhatsApp invite link.'
    : 'No email will be sent to them.'
  const btnBg = action === 'approve' ? '#0A0A0A' : 'transparent'
  const btnColor = action === 'approve' ? '#E8FF3A' : '#0A0A0A'
  const btnBorder = action === 'approve' ? 'none' : '1px solid rgba(10,10,10,0.2)'
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${verb} — Green Circle</title></head>
<body style="margin:0;padding:0;background:#F6F4EF;font-family:system-ui,sans-serif;color:#0A0A0A;
             display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;width:100%;padding:40px 32px;text-align:center;box-sizing:border-box;">
    <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6660;margin:0 0 24px;">
      — The Green Circle
    </p>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
      ${verb} ${escapeHtml(signup.name)}?
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#6B6660;margin:0 0 8px;">
      ${escapeHtml(signup.name)} (${escapeHtml(signup.email)}) is waiting on review.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#6B6660;margin:0 0 32px;">
      ${consequence}
    </p>
    <form method="POST" action="/api/approve-green-circle?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&action=${action}">
      <button type="submit" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;
              background:${btnBg};color:${btnColor};border:${btnBorder};border-radius:999px;cursor:pointer;">
        Yes, ${verb.toLowerCase()}
      </button>
    </form>
  </div>
</body></html>`
}

function htmlPage(title, message) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)} — Green Circle</title></head>
<body style="margin:0;padding:0;background:#F6F4EF;font-family:system-ui,sans-serif;color:#0A0A0A;
             display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;padding:40px 32px;text-align:center;">
    <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6660;margin:0 0 24px;">
      — The Green Circle
    </p>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">${escapeHtml(title)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#6B6660;margin:0;">${message}</p>
  </div>
</body></html>`
}

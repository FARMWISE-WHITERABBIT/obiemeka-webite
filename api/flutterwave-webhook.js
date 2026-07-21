import { SESSION_PRICING, getSupabase, sendBookingEmails } from './_lib/booking.js'

// Server-to-server webhook Flutterwave calls on transaction completion. This is
// the authoritative confirmation path — the browser redirect in verify-payment.js
// can be interrupted (closed tab, network drop), this can't. Both paths are
// idempotent against the same `payment_status: pending -> paid` transition.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['verif-hash']
  if (!signature || !process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH
      || signature !== process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Malformed body' })
  }

  const txRef = body?.data?.tx_ref
  const transactionId = body?.data?.id
  if (!txRef || !transactionId) return res.status(200).json({ received: true })

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.FLUTTERWAVE_SECRET_KEY) {
    console.error('flutterwave-webhook: missing Supabase/Flutterwave env vars')
    return res.status(200).json({ received: true })
  }

  const supabase = getSupabase()
  const { data: booking } = await supabase.from('bookings').select('*').eq('ref_num', txRef).single()
  if (!booking || booking.payment_status === 'paid') {
    return res.status(200).json({ received: true })
  }

  // Never trust the webhook payload's amount/status directly — re-verify with
  // Flutterwave's own API, same as the redirect path.
  let verifyJson
  try {
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    })
    verifyJson = await verifyRes.json()
  } catch (err) {
    console.error('flutterwave-webhook: verify call failed for', txRef, err)
    return res.status(200).json({ received: true })
  }

  const tx = verifyJson?.data
  const expectedAmount = SESSION_PRICING[booking.session]
  const ok = verifyJson?.status === 'success'
    && tx?.status === 'successful'
    && tx?.tx_ref === txRef
    && tx?.currency === 'NGN'
    && expectedAmount != null
    && tx?.amount >= expectedAmount

  if (!ok) return res.status(200).json({ received: true })

  // 'failed' is included so this can repair a row wrongly stamped by an
  // earlier redirect (e.g. a bank transfer that settled after the browser
  // returned). Idempotency holds: only the caller that flips the row to
  // paid sends emails.
  const { data: updated } = await supabase
    .from('bookings')
    .update({ payment_status: 'paid', flw_transaction_id: String(transactionId) })
    .eq('ref_num', txRef)
    .in('payment_status', ['pending', 'failed'])
    .select()

  if (updated && updated.length) {
    await sendBookingEmails(updated[0])
  }

  return res.status(200).json({ received: true })
}

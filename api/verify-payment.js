import { SESSION_PRICING, getSupabase, sendBookingEmails } from './_lib/booking.js'

// Flutterwave redirects the browser here after checkout. We never trust the
// redirect query params for the actual payment result — they're just enough
// to look up the booking; the real verification is the server-to-server
// call to Flutterwave's /verify endpoint below.
//
// The redirect `status` param varies by payment method: cards usually return
// 'successful' but bank transfers and some NGN flows return 'completed', and a
// transfer can still be settling when the browser comes back. So the param is
// only used to short-circuit explicit cancellations — every other outcome is
// decided by the verify API, and an in-flight payment is left 'pending' for
// the webhook to confirm rather than being stamped 'failed'.
export default async function handler(req, res) {
  const siteUrl = process.env.SITE_URL || 'https://obiemeka.com'
  const { status, tx_ref, transaction_id } = req.query

  const fail = () => res.redirect(302, `${siteUrl}/?booking=failed#book`)
  const processing = (ref) => res.redirect(302, `${siteUrl}/?booking=processing&ref=${encodeURIComponent(ref)}#book`)
  const succeed = (ref) => res.redirect(302, `${siteUrl}/?booking=success&ref=${encodeURIComponent(ref)}#book`)

  if (!tx_ref) return fail()
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.FLUTTERWAVE_SECRET_KEY) {
    console.error('verify-payment: missing Supabase/Flutterwave env vars')
    return fail()
  }

  const supabase = getSupabase()
  const { data: booking } = await supabase.from('bookings').select('*').eq('ref_num', tx_ref).single()
  if (!booking) return fail()

  // Already processed — e.g. the webhook beat this redirect to it.
  if (booking.payment_status === 'paid') return succeed(tx_ref)

  if (status === 'cancelled' || !transaction_id) {
    await supabase.from('bookings').update({ payment_status: 'failed' })
      .eq('ref_num', tx_ref).eq('payment_status', 'pending')
    return fail()
  }

  let verifyJson
  try {
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    })
    verifyJson = await verifyRes.json()
  } catch (err) {
    // Transient verify outage — leave the booking pending so the webhook can
    // still confirm it, and tell the customer it's processing.
    console.error('verify-payment: Flutterwave verify call failed for', tx_ref, err)
    return processing(tx_ref)
  }

  const tx = verifyJson?.data
  const expectedAmount = SESSION_PRICING[booking.session]
  const ok = verifyJson?.status === 'success'
    && tx?.status === 'successful'
    && tx?.tx_ref === tx_ref
    && tx?.currency === 'NGN'
    && expectedAmount != null
    && tx?.amount >= expectedAmount

  if (!ok) {
    console.error('verify-payment: verification not successful for', tx_ref, JSON.stringify(verifyJson))
    // A bank transfer can still be settling when the browser returns. Only a
    // definitive terminal state gets stamped 'failed' — anything in flight
    // stays 'pending' so the webhook can flip it to paid when it lands.
    const terminal = verifyJson?.status === 'success'
      && ['failed', 'cancelled', 'voided'].includes(tx?.status)
    if (terminal) {
      await supabase.from('bookings').update({ payment_status: 'failed' })
        .eq('ref_num', tx_ref).eq('payment_status', 'pending')
      return fail()
    }
    return processing(tx_ref)
  }

  // Idempotent: only the caller that actually flips the row to paid sends
  // emails, so a near-simultaneous webhook call never double-sends. 'failed'
  // is included so a row wrongly stamped by an earlier redirect gets repaired.
  const { data: updated } = await supabase
    .from('bookings')
    .update({ payment_status: 'paid', flw_transaction_id: String(transaction_id) })
    .eq('ref_num', tx_ref)
    .in('payment_status', ['pending', 'failed'])
    .select()

  if (updated && updated.length) {
    await sendBookingEmails(updated[0])
  }

  return succeed(tx_ref)
}

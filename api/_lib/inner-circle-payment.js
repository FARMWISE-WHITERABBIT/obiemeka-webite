import { Resend } from 'resend'
import { flutterwave } from './flutterwave.js'
import { INNER_CIRCLE_PREFIX, INNER_CIRCLE_PRICE } from '../inner-circle.js'

export async function recordInnerCirclePayment(db, txRef, transactionId) {
  const reference = txRef.slice(INNER_CIRCLE_PREFIX.length)
  if (!/^[0-9a-f-]{36}$/.test(reference) || !/^\d{1,20}$/.test(String(transactionId))) return
  const { data: order, error } = await db.from('inner_circle_checkouts')
    .select('email, transaction_id').eq('reference', reference).maybeSingle()
  if (error) throw error
  if (!order) return

  const verified = await flutterwave(`transactions/${transactionId}/verify`)
  const tx = verified.data
  if (verified.status !== 'success' || tx?.status !== 'successful' || tx.tx_ref !== txRef ||
      tx.currency !== 'NGN' || Number(tx.amount) !== INNER_CIRCLE_PRICE ||
      String(tx.id) !== String(transactionId) || tx.customer?.email?.toLowerCase() !== order.email) return

  if (!order.transaction_id) {
    const { error: updateError } = await db.from('inner_circle_checkouts')
      .update({ transaction_id: String(transactionId) }).eq('reference', reference).is('transaction_id', null)
    if (updateError) throw updateError
  }
  if (order.transaction_id && order.transaction_id !== String(transactionId)) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: process.env.NOTIFY_EMAIL || 'oe@obiemeka.com',
    subject: 'Inner Circle payment confirmed',
    text: `A first monthly payment of ₦50,000 was confirmed for ${order.email}. Verify the subscriber in the Flutterwave dashboard and arrange manual admission to the private WhatsApp group. Transaction ID: ${transactionId}.`,
  }, { idempotencyKey: `inner-circle-first-payment/${transactionId}` })
  if (emailError) throw emailError
}

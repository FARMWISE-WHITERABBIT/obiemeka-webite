import { analyticsClientId } from './_lib/analytics.js'
import { randomUUID } from 'node:crypto'
import { getSupabase } from './_lib/booking.js'
import { flutterwave, inlineCheckoutOptions } from './_lib/flutterwave.js'

export const INNER_CIRCLE_PRICE = 50000
export const INNER_CIRCLE_PREFIX = 'INNER-CIRCLE-'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  const plan = process.env.FLUTTERWAVE_INNER_CIRCLE_PLAN_ID
  if (process.env.INNER_CIRCLE_ENABLED !== 'true' || !/^\d+$/.test(plan || '')) {
    return res.status(503).json({ error: 'Inner Circle checkout is not open yet.' })
  }
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || req.body?.consent !== true) {
    return res.status(400).json({ error: 'Enter your email and confirm monthly billing.' })
  }

  try {
    const db = getSupabase()
    const { data: signup, error: signupError } = await db.from('green_circle_signups')
      .select('email').eq('email', email).eq('status', 'approved').maybeSingle()
    if (signupError) throw signupError
    if (!signup) return res.status(400).json({ error: 'Use the email associated with an approved free Green Circle membership.' })

    const subscriptionParams = new URLSearchParams({ email, plan, status: 'active' })
    const subscriptions = await flutterwave(`subscriptions?${subscriptionParams}`)
    if (subscriptions.status !== 'success' || !Array.isArray(subscriptions.data)) throw new Error('Unable to check subscriptions')
    if (subscriptions.data.length) {
      return res.status(409).json({ error: 'This email already has an active Inner Circle subscription.' })
    }

    function checkoutResponse(reference, checkoutUrl) {
      const inlineCheckout = inlineCheckoutOptions({
        txRef: INNER_CIRCLE_PREFIX + reference, amount: INNER_CIRCLE_PRICE, email,
        title: 'Green Circle Inner Circle — monthly membership', plan,
      })
      return res.status(200).json({ checkoutUrl, inlineCheckout })
    }

    const reference = randomUUID()
    const { error: insertError } = await db.from('inner_circle_checkouts').insert({ email, reference })
    if (insertError?.code === '23505') {
      const { data: existing, error } = await db.from('inner_circle_checkouts')
        .select('reference, checkout_url, transaction_id').eq('email', email).single()
      if (error) throw error
      if (existing.checkout_url && !existing.transaction_id) {
        return checkoutResponse(existing.reference, existing.checkout_url)
      }
      return res.status(409).json({ error: 'A checkout already exists for this email. Contact oe@obiemeka.com if you need help restarting it.' })
    }
    if (insertError) throw insertError

    const result = await flutterwave('payments', {
      tx_ref: INNER_CIRCLE_PREFIX + reference,
      amount: INNER_CIRCLE_PRICE,
      currency: 'NGN',
      meta: { analytics_client_id: analyticsClientId(req) },
      payment_plan: Number(plan),
      redirect_url: `${process.env.SITE_URL || 'https://obiemeka.com'}/links?inner_circle=returned`,
      customer: { email },
      customizations: { title: 'Green Circle Inner Circle — monthly membership' },
    })
    const url = new URL(result.data?.link)
    if (result.status !== 'success' || url.protocol !== 'https:' || url.hostname !== 'checkout.flutterwave.com') {
      throw new Error('Unexpected checkout link')
    }
    const { error } = await db.from('inner_circle_checkouts')
      .update({ checkout_url: url.href }).eq('reference', reference)
    if (error) throw error
    return checkoutResponse(reference, url.href)
  } catch {
    return res.status(503).json({ error: 'Checkout is temporarily unavailable. Contact oe@obiemeka.com if the issue persists.' })
  }
}

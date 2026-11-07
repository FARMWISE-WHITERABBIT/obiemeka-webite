import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { flutterwave } from './_lib/flutterwave.js'
import { getSupabase } from './_lib/booking.js'
import { assessAgribusinessFit } from '../src/lib/agri-fit/assess.mjs'

const PRICE = 15000
const COOKIE = 'oe_quiz'
const SITE = process.env.SITE_URL || 'https://obiemeka.com'
const referencePattern = /^[0-9a-f-]{36}$/
const hash = token => createHash('sha256').update(token).digest('hex')


export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (process.env.AGRI_QUIZ_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Quiz checkout is not available yet.' })
  }
  const body = req.body || {}
  try {
    const db = getSupabase()
    if (body.action === 'checkout') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email address.' })
      }
      let report
      try { report = assessAgribusinessFit(body.answers) }
      catch (error) { return res.status(400).json({ error: error.message }) }

      const reference = randomUUID()
      const token = randomBytes(32).toString('hex')
      const { error } = await db.from('agri_quiz_orders').insert({
        reference, email, access_hash: hash(token), report,
      })
      if (error) throw error
      const result = await flutterwave('payments', {
        tx_ref: `AGRI-QUIZ-${reference}`,
        amount: PRICE,
        currency: 'NGN',
        redirect_url: `${SITE}/links?quiz_order=${reference}`,
        customer: { email },
        customizations: { title: 'Know the Right Agricultural Business for You' },
      })
      const url = new URL(result.data?.link)
      if (result.status !== 'success' || url.protocol !== 'https:' || url.hostname !== 'checkout.flutterwave.com') {
        throw new Error('Unexpected checkout link')
      }
      res.setHeader('Set-Cookie', `${COOKIE}_${reference}=${token}; Path=/api/agri-quiz; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`)
      return res.status(200).json({ checkoutUrl: url.href })
    }

    const reference = body.reference
    if (typeof reference !== 'string' || !referencePattern.test(reference)) {
      return res.status(400).json({ error: 'Invalid order reference.' })
    }
    const token = req.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${COOKIE}_${reference}=([0-9a-f]{64})(?:;|$)`))?.[1]
    if (!token) return res.status(403).json({ error: 'Open the quiz in the browser where you paid.' })
    const { data: order, error: lookupError } = await db.from('agri_quiz_orders')
      .select('transaction_id, report').eq('reference', reference).eq('access_hash', hash(token)).maybeSingle()
    if (lookupError) throw lookupError
    if (!order) return res.status(403).json({ error: 'Could not find your quiz order.' })

    if (body.action === 'verify') {
      if (!order.transaction_id) {
        const txRef = `AGRI-QUIZ-${reference}`
        const transactionId = String(body.transactionId || '')
        const result = await flutterwave(/^\d{1,20}$/.test(transactionId)
          ? `transactions/${transactionId}/verify`
          : `transactions/verify_by_reference?tx_ref=${txRef}`)
        const tx = result.data
        if (result.status !== 'success' || tx?.status !== 'successful' ||
            tx.tx_ref !== txRef || tx.currency !== 'NGN' || Number(tx.amount) !== PRICE ||
            !/^\d{1,20}$/.test(String(tx.id))) {
          return res.status(409).json({ error: 'Payment has not been confirmed. If you paid, wait a moment and check again.' })
        }
        const { error } = await db.from('agri_quiz_orders')
          .update({ transaction_id: String(tx.id) }).eq('reference', reference).is('transaction_id', null)
        if (error) throw error
      }
      return res.status(200).json({ report: order.report })
    }

    if (body.action === 'report') {
      if (!order.transaction_id) return res.status(403).json({ error: 'Confirm payment before generating a report.' })
      if (order.report) return res.status(200).json({ report: order.report })
      let report
      try { report = assessAgribusinessFit(body.answers) }
      catch (error) { return res.status(400).json({ error: error.message }) }

      const { data, error } = await db.from('agri_quiz_orders').update({ report })
        .eq('reference', reference).is('report', null).select('report').maybeSingle()
      if (error) throw error
      if (data) return res.status(200).json({ report: data.report })
      const { data: existing, error: readError } = await db.from('agri_quiz_orders')
        .select('report').eq('reference', reference).single()
      if (readError) throw readError
      return res.status(200).json({ report: existing.report })
    }

    return res.status(400).json({ error: 'Unknown request.' })
  } catch {
    return res.status(503).json({ error: 'The quiz service is temporarily unavailable. Please try again.' })
  }
}

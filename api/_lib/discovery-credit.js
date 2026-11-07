import { createHmac, timingSafeEqual } from 'node:crypto'
import { QUIZ_REFERENCE_PATTERN } from './agri-quiz-payment.js'

export const DISCOVERY_CREDIT = 15000

export function discoveryCreditToken(reference) {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY
  if (!secret || !QUIZ_REFERENCE_PATTERN.test(reference)) return null
  return createHmac('sha256', secret).update('oe-discovery-credit-v1:' + reference).digest('hex')
}

export function validDiscoveryCredit(reference, token) {
  if (typeof reference !== 'string' || typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return false
  const expected = discoveryCreditToken(reference)
  return Boolean(expected && timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex')))
}

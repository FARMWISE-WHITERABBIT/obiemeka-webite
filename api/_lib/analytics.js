const measurementId = 'G-YFDXY1KVNW'
const clientIdPattern = /^\d{1,20}\.\d{1,20}$/

export function analyticsClientId(req) {
  const match = /(?:^|;\s*)_ga=GA\d+\.\d+\.(\d{1,20}\.\d{1,20})(?=;|$)/.exec(req.headers.cookie || '')
  return match?.[1]
}

export async function trackPurchase(tx, itemId) {
  const secret = process.env.GA4_MEASUREMENT_PROTOCOL_SECRET
  const transactionId = String(tx.id ?? '')
  const value = Number(tx.amount)
  if (!secret || !/^\d{1,20}$/.test(transactionId) || tx.currency !== 'NGN' || !Number.isFinite(value) || value <= 0) return

  const clientId = tx.meta?.analytics_client_id
  const url = new URL('https://www.google-analytics.com/mp/collect')
  url.search = new URLSearchParams({ measurement_id: measurementId, api_secret: secret })
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2500),
      body: JSON.stringify({
        client_id: clientIdPattern.test(clientId) ? clientId : transactionId + '.1',
        events: [{
          name: 'purchase',
          params: {
            transaction_id: 'flutterwave-' + transactionId,
            currency: 'NGN',
            value,
            items: [{ item_id: itemId, price: value, quantity: 1 }],
          },
        }],
      }),
    })
    if (!response.ok) console.error('GA4 purchase request failed', response.status)
  } catch {
    console.error('GA4 purchase request failed')
  }
}

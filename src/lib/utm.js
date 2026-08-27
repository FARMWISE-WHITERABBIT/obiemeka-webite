// Shared UTM helpers — Component 5 (funnel tracking).
//
// Every entry point that sends traffic to /greencircle-community (exit popup, each
// blog post's CTA, each YouTube description link) tags its link with UTM
// params so signups can be attributed back to the source. This module reads
// whatever UTM params are on the current URL, persists them across the visit
// (sessionStorage) so they survive the two-step capture -> confirm flow, and
// builds outbound /greencircle-community links carrying a given entry point's tags.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
const STORAGE_KEY = 'oe_utm_v1'

export function captureUtmFromLocation() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const found = {}
  UTM_KEYS.forEach((k) => {
    const v = params.get(k)
    if (v) found[k] = v.slice(0, 100)
  })
  if (Object.keys(found).length) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found)) } catch { /* ignore */ }
    return found
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return {}
}

// Builds a /greencircle-community URL tagged for a specific entry point, e.g.
// buildGreenCircleLink({ source: 'blog', medium: 'cta-end', campaign: 'my-post-slug' })
export function buildGreenCircleLink({ source, medium, campaign, content } = {}) {
  const params = new URLSearchParams()
  if (source) params.set('utm_source', source)
  if (medium) params.set('utm_medium', medium)
  if (campaign) params.set('utm_campaign', campaign)
  if (content) params.set('utm_content', content)
  const qs = params.toString()
  return '/greencircle-community' + (qs ? `?${qs}` : '')
}

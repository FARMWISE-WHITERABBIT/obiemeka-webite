import { track } from '@vercel/analytics'

const sources = new Set(['instagram', 'linkedin', 'youtube', 'whatsapp', 'facebook', 'tiktok', 'newsletter', 'qr'])
const campaignFields = {
  utm_source: sources,
  utm_medium: new Set(['bio', 'social', 'video', 'message', 'email', 'print']),
  utm_campaign: new Set(['links', 'links_launch']),
}

function campaignSource() {
  const source = new URLSearchParams(window.location.search).get('utm_source')?.toLowerCase()
  return sources.has(source) ? source : 'untagged'
}

export function trackLinks(action, destination) {
  if (window.location.pathname.replace(/\/$/, '') !== '/links') return
  track('Links action', { action: `${action}:${destination}`, source: campaignSource() })
}

export function cleanLinksAnalyticsUrl(event) {
  const url = new URL(event.url, 'https://obiemeka.com')
  if (!['/links', '/agribusiness-quiz', '/inner-circle'].includes(url.pathname.replace(/\/$/, ''))) return event
  const clean = new URLSearchParams()
  for (const [key, allowed] of Object.entries(campaignFields)) {
    const value = url.searchParams.get(key)?.toLowerCase()
    if (allowed.has(value)) clean.set(key, value)
  }
  url.search = clean.toString()
  url.hash = ''
  return { ...event, url: url.toString() }
}

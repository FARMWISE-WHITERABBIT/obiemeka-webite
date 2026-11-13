export const linkSources = new Set(['instagram', 'linkedin', 'youtube', 'whatsapp', 'facebook', 'tiktok', 'newsletter', 'qr'])

const destinations = {
  open: new Set(['quiz', 'join', 'inner', 'book']),
  click: new Set(['whiterabbit-agro', 'origintrace', 'farmwise', 'journal', 'homepage', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube']),
  submitted: new Set(['join']),
  report_ready: new Set(['quiz']),
  checkout_started: new Set(['quiz', 'inner', 'book', 'discovery_credit']),
}

export function isLinksEvent(action, destination, source) {
  return Object.hasOwn(destinations, action) && destinations[action].has(destination)
    && (linkSources.has(source) || source === 'untagged')
}

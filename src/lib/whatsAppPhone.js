export function isWhatsAppPhone(value) {
  return typeof value === 'string' && /^\+?\d{7,15}$/.test(value.trim().replace(/[\s().-]/g, ''))
}

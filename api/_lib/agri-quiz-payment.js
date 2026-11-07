import { Resend } from 'resend'
import { createQuizPdf, QUIZ_REPORT_FILENAME } from './agri-quiz-pdf.js'
import { flutterwave } from './flutterwave.js'

export const QUIZ_PRICE = 15000
export const QUIZ_PREFIX = 'AGRI-QUIZ-'
export const QUIZ_ORDER_COLUMNS = 'email, transaction_id, report, report_emailed_at'
export const QUIZ_REFERENCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function verifyQuizPayment(db, reference, order, transactionId) {
  if (order.transaction_id) return true
  const txRef = QUIZ_PREFIX + reference
  const id = String(transactionId || '')
  const result = await flutterwave(/^\d{1,20}$/.test(id)
    ? `transactions/${id}/verify`
    : `transactions/verify_by_reference?tx_ref=${txRef}`)
  const tx = result.data
  if (result.status !== 'success' || tx?.status !== 'successful' ||
      tx.tx_ref !== txRef || tx.currency !== 'NGN' || Number(tx.amount) !== QUIZ_PRICE ||
      !/^\d{1,20}$/.test(String(tx.id))) return false
  const { error } = await db.from('agri_quiz_orders')
    .update({ transaction_id: String(tx.id) }).eq('reference', reference).is('transaction_id', null)
  if (error) throw error
  return true
}

export async function emailQuizReport(db, reference, order) {
  if (order.report_emailed_at) return true
  if (!order.report || !process.env.RESEND_API_KEY) return false
  const report = order.report
  const lines = [
    'Your agribusiness fit report', '',
    report.overview,
    ...(report.capital?.length ? ['', 'Capital and cash needs', ...report.capital] : []),
    '', 'Start here', report.nextStep,
  ]
  for (const route of report.shortlist) {
    lines.push('', route.name, ...route.reasons.map(reason => '• ' + reason),
      'First test: ' + route.nextStep)
    if (route.budgetCheck) lines.push('Numbers to collect: ' + route.budgetCheck)
    if (route.stop) lines.push('When to pause: ' + route.stop)
  }
  if (report.revisit.length) lines.push('', 'Routes to revisit')
  for (const route of report.revisit) {
    lines.push('', route.name, ...route.blockers.map(blocker => '• ' + blocker))
    if (route.nextStep) lines.push('How to recheck it: ' + route.nextStep)
  }
  if (report.plan?.length) lines.push('', 'Your first 90 days')
  for (const step of report.plan || []) lines.push(step.when + ' — ' + step.action)
  lines.push('', 'Use this assessment to screen business options. Check local costs, demand and operating requirements before committing capital.')

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: `Obi Emeka <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
    to: order.email,
    subject: 'Your agribusiness fit report',
    text: 'Your PDF report is attached. Keep a copy as you check your options and work through your 90-day plan.\n\n' +
      lines.filter(line => line != null).join('\n'),
    attachments: [{ filename: QUIZ_REPORT_FILENAME, content: (await createQuizPdf(report)).toString('base64') }],
  }, { idempotencyKey: `agri-quiz-report/${reference}` })
  if (error) throw new Error('Report email was not accepted')
  const { error: updateError } = await db.from('agri_quiz_orders')
    .update({ report_emailed_at: new Date().toISOString() }).eq('reference', reference)
  if (updateError) throw updateError
  return true
}

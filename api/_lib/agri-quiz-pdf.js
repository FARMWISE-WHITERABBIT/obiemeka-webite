import PDFDocument from 'pdfkit'

export const QUIZ_REPORT_FILENAME = 'obi-emeka-agribusiness-fit-report.pdf'

const ink = '#202B24'
const green = '#254C38'
const muted = '#4D6355'
const line = '#CCDCD1'
const tint = '#EAF2EA'
const paper = '#F7F9F4'
const margin = 50
const width = 495
const bottom = 778
const text = value => String(value || '').replaceAll('₦', 'NGN ').replace(/[–—]/g, '-')

export function createQuizPdf(report) {
  const doc = new PDFDocument({
    size: 'A4', margin: 0, bufferPages: true,
    info: { Title: 'Your agribusiness fit report', Author: 'Obi Emeka' },
  })
  const buffers = []
  const finished = new Promise((resolve, reject) => {
    doc.on('data', chunk => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)
  })

  let y = 0
  const options = { width, lineGap: 3 }

  function page() {
    doc.addPage()
    doc.rect(0, 0, doc.page.width, 8).fill(green)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(green)
      .text('OBI EMEKA', margin, 32, { lineBreak: false })
    doc.font('Helvetica').fontSize(9).fillColor(muted)
      .text('AGRIBUSINESS ASSESSMENT', margin, 32, { width, align: 'right' })
    y = 62
  }

  function ensure(height) {
    if (y + height > bottom) page()
  }

  function body(value, { x = margin, blockWidth = width, bold = false, colour = ink, gap = 7 } = {}) {
    if (!value) return
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10.5)
    const style = { width: blockWidth, lineGap: 3 }
    const height = doc.heightOfString(text(value), style)
    ensure(height + gap)
    doc.fillColor(colour).text(text(value), x, y, style)
    y += height + gap
  }

  function section(number, title, minBody = 30) {
    ensure(48 + minBody)
    doc.moveTo(margin, y).lineTo(margin + width, y).lineWidth(0.6).strokeColor(line).stroke()
    y += 12
    doc.font('Helvetica-Bold').fontSize(9).fillColor(muted).text(number, margin, y + 4, { lineBreak: false })
    doc.font('Helvetica-Bold').fontSize(16).fillColor(green).text(title, margin + 30, y, { width: width - 30 })
    y += 28
  }

  function measureCard(route, details, index) {
    const inset = 12
    const cardWidth = width - inset * 2
    doc.font('Helvetica-Bold').fontSize(12)
    const heading = `${index + 1}. ${text(route.name)}`
    const headingHeight = doc.heightOfString(heading, { width: cardWidth, lineGap: 2 })
    doc.font('Helvetica').fontSize(10.5)
    const contentHeight = details.reduce((height, entry) =>
      height + doc.heightOfString(text(entry), { width: cardWidth, lineGap: 3 }) + 4, 0)
    const cardHeight = inset * 2 + headingHeight + 8 + contentHeight
    return { inset, cardWidth, heading, headingHeight, cardHeight }
  }

  function routeCard(route, details, index) {
    const { inset, cardWidth, heading, headingHeight, cardHeight } = measureCard(route, details, index)
    ensure(cardHeight)
    doc.roundedRect(margin, y, width, cardHeight, 8).fillAndStroke(paper, line)
    y += inset
    doc.font('Helvetica-Bold').fontSize(12).fillColor(green)
      .text(heading, margin + inset, y, { width: cardWidth, lineGap: 2 })
    y += headingHeight + 8
    for (const entry of details) body(entry, { x: margin + inset, blockWidth: cardWidth, gap: 4 })
    y += inset + 8
  }

  // The first page is already created by PDFKit.
  doc.rect(0, 0, doc.page.width, 8).fill(green)
  doc.font('Helvetica-Bold').fontSize(10).fillColor(green).text('OBI EMEKA  /  AGRIBUSINESS ADVISORY', margin, 37, options)
  doc.roundedRect(margin, 68, width, 111, 11).fill(tint)
  doc.font('Times-Bold').fontSize(29).fillColor(green).text('Your agribusiness\nfit report', margin + 22, 89, { width: width - 44, lineGap: 2 })
  y = 199
  body(report.overview, { gap: 12 })
  body('START HERE', { bold: true, colour: green, gap: 4 })
  body(report.nextStep, { gap: 15 })

  let number = 0
  const next = () => String(++number).padStart(2, '0')
  if (report.capital?.length) {
    section(next(), 'Capital and cash needs')
    for (const entry of report.capital) body(entry)
    y += 7
  }

  function routeSection(title, routes, describe) {
    if (!routes?.length) return
    const cards = routes.map(route => ({ route, details: describe(route) }))
    const first = cards[0]
    section(next(), title, measureCard(first.route, first.details, 0).cardHeight)
    cards.forEach(({ route, details }, index) => routeCard(route, details, index))
  }

  routeSection('Business options worth testing', report.shortlist, route => {
    const details = route.reasons.map(reason => '• ' + reason)
    if (route.nextStep) details.push('First test. ' + route.nextStep)
    if (route.budgetCheck) details.push('Numbers to collect. ' + route.budgetCheck)
    if (route.stop) details.push('When to pause. ' + route.stop)
    return details
  })
  routeSection('Options to revisit', report.revisit, route => {
    const details = route.blockers.map(blocker => '• ' + blocker)
    if (route.nextStep) details.push('How to recheck it. ' + route.nextStep)
    return details
  })

  if (report.plan?.length) {
    section(next(), 'Your first 90 days', 75)
    for (const step of report.plan) {
      ensure(65)
      body(step.when, { bold: true, colour: green, gap: 4 })
      body(step.action, { gap: 8 })
    }
  }

  section(next(), 'Review the report with Obi Emeka', 49)
  body('Your paid quiz gives you a one-time NGN 15,000 credit towards the 45-minute Discovery Call, bringing the price to NGN 135,000. Open your paid report on obiemeka.com/links to book with the same email address.')
  body('Check local costs, demand and operating requirements before committing capital. This assessment screens for business fit and does not estimate returns.', { colour: muted })

  const pages = doc.bufferedPageRange()
  for (let index = 0; index < pages.count; index++) {
    doc.switchToPage(pages.start + index)
    doc.moveTo(margin, 792).lineTo(margin + width, 792).lineWidth(0.6).strokeColor(line).stroke()
    doc.font('Helvetica').fontSize(8).fillColor(muted).text('OBIEMEKA.COM  /  PRIVATE REPORT', margin, 803, { lineBreak: false })
    doc.text(`${index + 1} / ${pages.count}`, margin, 803, { width, align: 'right' })
  }
  doc.end()
  return finished
}

// Product-specific requirements precede budget arithmetic. Supplier benchmarks
// are scoped equipment examples, not universal Nigerian startup costs.
const capitalRequirements = {
  chocolate: {
    inHouse: 'Obtain an installed quote covering the production steps you will own: roasting and winnowing for bean-to-bar, refining, tempering, moulding, cooling and storage. Add facility fit-out, reliable power, food-safety checks, packaging and distribution.',
    contract: 'Get a written quote from a suitable manufacturer stating the minimum batch, unit price, what inputs and packaging are included, payment terms, testing and how the finished chocolate will be stored and delivered.',
    benchmark: 'As a scale reference, Selmi lists a professional 12 kg tempering machine at €8,500. That is one equipment item before freight, installation or the rest of the line, and is not a minimum for every production model.',
  },
  palmOil: {
    inHouse: 'Confirm tonnes of fresh fruit bunches per hour and obtain an installed quote for all required stages, utilities, civil works and waste handling. Budget for seasonal fruit procurement and transport as well as the machinery.',
    contract: 'Get written toll-milling rates, minimum loads, transport, expected oil recovery and waste responsibilities. Check the supply and buyer terms for that trial volume.',
    benchmark: 'One mill supplier publishes US$95,800–US$300,800 for complete 1–5 tonne-per-hour lines. This is a supplier equipment benchmark for that scale, not a Nigerian turnkey budget or a price for artisanal processing.',
  },
}

export function checkProcessingCapital(product, setup, scope, quotes, budget) {
  const requirements = capitalRequirements[product]
  if (!requirements) return null
  const checklist = requirements[setup] || 'Choose a processing model and get an itemised quote before judging whether the capital is enough.'
  const blockers = []
  if (setup === 'contract' && scope === 'commercial') {
    blockers.push('Confirm the manufacturer can meet commercial volumes and quality requirements, and fund at least one full production and sales cycle.')
  }
  if (quotes !== true || budget?.available == null || !budget.hasQuotes) {
    blockers.push('A rough budget alone cannot establish affordability. ' + checklist)
  }
  return { checklist, benchmark: setup === 'inHouse' ? requirements.benchmark : '', blockers }
}

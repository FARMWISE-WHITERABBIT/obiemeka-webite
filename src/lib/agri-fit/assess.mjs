// Route screening for Nigerian agribusiness. Thresholds are questionnaire
// categories and screening assumptions, not market prices or return estimates.
export const routes = [
  {
    id: 'services', name: 'Agricultural services',
    fit: 'Use existing skills to solve a specific problem for farms or agribusinesses.',
    goal: ['cashflow', 'buildBusiness'], skills: ['services', 'operations'],
    cashCycles: ['short', 'medium', 'long'],
    checks: [],
    budget: 'Compare the fee per job with travel, labour, materials and the time you spend finding clients.',
    validate: 'Interview three potential clients and agree the scope and fee for one small paid pilot.',
  },
  {
    id: 'trade', name: 'Buyer-led aggregation and distribution',
    fit: 'Source a product against a buyer specification and earn on reliable delivery.',
    goal: ['cashflow', 'buildBusiness'], skills: ['sales', 'operations'],
    cashCycles: ['short', 'medium', 'long'],
    checks: [['buyerAccess', 'Confirm a buyer, quality specifications, rejection rules and payment terms.']],
    budget: 'Calculate contribution per delivered unit and how much cash you need between paying suppliers and collecting from the buyer.',
    validate: 'Cost one small order including transport, losses and the cash tied up until the buyer pays.',
  },
  {
    id: 'production', name: 'Short-cycle crop production',
    fit: 'Pilot a crop with a known market before expanding production.',
    goal: ['cashflow', 'buildBusiness'], skills: ['production', 'operations'],
    cashCycles: ['medium', 'long'],
    checks: [
      ['siteAccess', 'Confirm access to suitable land and water.'],
      ['operatingCoverage', 'Arrange reliable day-to-day coverage.'],
      ['buyerAccess', 'Confirm where and on what terms you can sell the harvest.'],
    ],
    budget: 'Compare the cost of a complete cycle with revenue at a conservative sellable yield and buyer price.',
    validate: 'Get local input quotes and test a small production cycle with conservative yield and loss assumptions.',
  },
  {
    id: 'processing', name: 'Small-batch processing and packaging',
    fit: 'Test demand for a processed product through a small batch or a contract processor.',
    goal: ['buildBusiness', 'cashflow'], skills: ['operations', 'sales'],
    cashCycles: ['medium', 'long'],
    checks: [
      ['buyerAccess', 'Identify a sales channel and test what customers will pay.'],
      ['operatingCoverage', 'Arrange production and quality control coverage.'],
    ],
    budget: 'Track how many sellable packs a batch produces and whether the selling price covers raw materials, processing, packaging and distribution.',
    validate: 'Quote a compliant pilot batch and calculate cost per sellable unit, including packaging, rejects and distribution.',
  },
  {
    id: 'perennial', name: 'Perennial crops and managed farm development',
    fit: 'Build a productive asset over time with patient capital and accountable operations.',
    goal: ['legacy', 'buildBusiness'], skills: ['production', 'operations'],
    cashCycles: ['long'],
    checks: [
      ['siteAccess', 'Verify land rights, site suitability and water access.'],
      ['operatingCoverage', 'Identify an accountable local operator and establish oversight.'],
    ],
    budget: 'Separate initial development costs from operating costs and map how long you can fund both before the asset generates cash.',
    validate: 'Have an independent adviser review land tenure and build a cash budget through establishment and early production.',
  },
]

const processingProducts = {
  plantainChips: {
    name: 'Plantain chips',
    validate: 'Check whether suppliers can deliver firm green plantain consistently. Use a small trial batch to measure sellable packs, oil use and rejects. Confirm pack size and wholesale terms with retailers before buying equipment.',
    budget: 'Calculate cost per sellable pack using plantain, frying oil, fuel, labour, packaging, rejects and delivery. Compare it with the price you actually receive from the retailer.',
  },
  coconutOil: {
    name: 'Coconut oil',
    validate: 'Choose the intended market and buyer specification first. Ask a processor to run a small extraction trial and document input weight, saleable oil yield, quality checks and storage requirements.',
    budget: 'Calculate cost per saleable litre from the actual extraction yield, including coconuts, extraction, filtering, testing, containers and delivery. Compare it with a buyer’s quoted price.',
  },
  other: { name: 'Your chosen processed product' },
}

const categories = {
  goal: ['cashflow', 'buildBusiness', 'legacy'],
  role: ['operator', 'partner', 'passive'],
  cashHorizon: ['short', 'medium', 'long'],
  capitalPosition: ['noRiskCapital', 'pilotOnly', 'canFundOperations'],
  skills: ['none', 'production', 'sales', 'operations', 'services'],
  funding: ['ownFunds', 'partnerFunds', 'borrowed'],
  oversight: ['local', 'visits', 'remote'],
  lossTolerance: ['low', 'moderate', 'high'],
}
const flags = ['buyerAccess', 'siteAccess', 'operatingCoverage']

const horizons = {
  short: 'within three months',
  medium: 'within three to twelve months',
  long: 'on a horizon beyond one year',
}

function preparationReport(overview, nextStep, revisit = []) {
  return {
    status: 'prepare', shortlist: [], revisit, overview, nextStep,
    plan: [
      { when: 'Days 1–30', action: nextStep },
      { when: 'Days 31–60', action: 'Collect local quotes and speak to operators about costs, delays and where money tends to get tied up.' },
      { when: 'Days 61–90', action: 'Reassess once you can explain how the business would be funded, operated and supervised. Keep capital uncommitted if key gaps remain.' },
    ],
  }
}

export function assessAgribusinessFit(answers) {
  for (const [key, options] of Object.entries(categories)) {
    if (!options.includes(answers?.[key])) throw new TypeError(`Invalid answer: ${key}`)
  }
  for (const key of flags) {
    if (typeof answers[key] !== 'boolean') throw new TypeError(`Invalid answer: ${key}`)
  }
  if (!Number.isInteger(answers.weeklyHours) || answers.weeklyHours < 0 || answers.weeklyHours > 168) {
    throw new TypeError('Invalid answer: weeklyHours')
  }

  const productKey = answers.processingProduct || ''
  if (productKey && (!Object.hasOwn(processingProducts, productKey) ||
      !['inHouse', 'contract', 'undecided'].includes(answers.processingSetup) ||
      typeof answers.feedstockAccess !== 'boolean')) {
    throw new TypeError('Invalid processing answers')
  }
  const product = productKey ? processingProducts[productKey] : null

  if (answers.capitalPosition === 'noRiskCapital' || (answers.funding === 'borrowed' && answers.lossTolerance === 'low')) {
    return preparationReport(
      'Your answers suggest that an operating loss could disrupt your other commitments. The next step is to gather evidence without taking on a financial obligation.',
      'Protect household reserves. Interview buyers or operators and build a pilot budget before committing money.',
    )
  }
  if (answers.role === 'passive') {
    return preparationReport(
      'You prefer a capital role with limited day-to-day involvement. Your fit depends heavily on who will run the business and how you can independently check their work.',
      'Define who will operate the business and how you would verify their track record, reporting and use of funds. Reassess after defining your oversight role.',
    )
  }

  const assessed = routes.map(route => {
    const reasons = [route.fit]
    let score = 0
    if (route.goal.includes(answers.goal)) {
      score += 3
      const goals = {
        cashflow: 'Supports your goal of generating operating cash flow.',
        buildBusiness: 'Supports your goal of building a business you can scale.',
        legacy: 'Fits your goal of building a long-term family asset.',
      }
      reasons.push(goals[answers.goal])
    }
    if (route.id === 'trade' && answers.buyerAccess) {
      reasons.push('You can already reach a potential buyer and confirm their terms.')
    }
    if (route.id === 'perennial' && answers.siteAccess && answers.operatingCoverage) {
      reasons.push('You reported access to a suitable site and day-to-day operating coverage.')
    }
    if (route.skills.includes(answers.skills)) {
      score += 2
      reasons.push('Builds on experience you already have.')
    }

    const processing = route.id === 'processing' && product
    const hasContractProcessor = processing && answers.processingSetup === 'contract'
    if (processing) {
      score += 4
      reasons.push(`Evaluates your stated interest in ${product.name.toLowerCase()}.`)
      if (hasContractProcessor) reasons.push('A contract processor can help you test the market before investing in equipment.')
    }

    const blockers = route.checks
      .filter(([key]) => !answers[key] && !(key === 'operatingCoverage' && hasContractProcessor))
      .map(([, message]) => message)
    if (processing && !answers.feedstockAccess) {
      blockers.push('Confirm reliable raw-material supply, quality specifications and delivered prices before planning a batch.')
    }
    if (processing && answers.processingSetup === 'inHouse' && !answers.siteAccess) {
      blockers.push('Confirm a suitable processing site, utilities and hygiene controls before buying equipment.')
    }
    if (processing && answers.processingSetup === 'undecided') {
      blockers.push('Compare an in-house pilot with a quote from a suitable contract processor.')
    }
    if (!route.cashCycles.includes(answers.cashHorizon)) {
      blockers.push('Your cash deadline is too short to depend on this route.')
    }
    if (route.id === 'perennial' && answers.capitalPosition === 'pilotOnly') {
      blockers.push('Budget separately for establishment and operations before considering this route.')
    }
    if (answers.oversight === 'remote' && !answers.operatingCoverage && !hasContractProcessor && route.id !== 'services') {
      blockers.push('Arrange local oversight and reporting before running this route remotely.')
    }
    if (answers.lossTolerance === 'low' && ['production', 'perennial', 'processing'].includes(route.id)) {
      blockers.push('Confirm a small pilot with a firm loss limit before taking on production or equipment costs.')
    }
    if (answers.funding === 'borrowed' && route.id !== 'services') {
      blockers.push('Stress-test repayments against late sales and lower volumes before relying on borrowed funds.')
    }
    if (answers.weeklyHours < 5 && !answers.operatingCoverage && !hasContractProcessor) {
      blockers.push('Set aside more time or put reliable operational support in place.')
    }
    return {
      id: route.id,
      name: processing ? `${route.name}: ${product.name}` : route.name,
      score, reasons, blockers,
      nextStep: processing
        ? `${product.validate || route.validate} Confirm the applicable food safety, registration and labelling requirements before selling.`
        : route.validate,
      budgetCheck: (processing && product.budget) || route.budget,
    }
  }).sort((a, b) => b.score - a.score)

  const shortlist = assessed.filter(item => !item.blockers.length && item.score > 0).slice(0, 3)
  const revisit = assessed.filter(item => item.blockers.length).slice(0, 3)
  const first = shortlist[0]
  if (!first) {
    return preparationReport(
      'The routes assessed do not currently match enough of your goals, experience and operating constraints to shortlist.',
      'Address the prerequisites on the closest route and rerun the assessment before committing money.',
      revisit,
    )
  }
  const time = answers.weeklyHours === 1 ? 'one hour' : `${answers.weeklyHours} hours`
  return {
    status: 'shortlist', shortlist, revisit, nextStep: first.nextStep,
    overview: `You can give the business ${time} a week and want it to generate cash ${horizons[answers.cashHorizon]}. Of the options assessed, ${first.name.toLowerCase()} is your strongest starting point given the goals, experience and operating resources you reported.`,
    plan: [
      { when: 'Days 1–30', action: first.nextStep },
      { when: 'Days 31–60', action: first.budgetCheck },
      { when: 'Days 61–90', action: 'Review the evidence against your time and cash limits. Proceed only if buyers, costs and operating coverage check out. For a long-cycle venture, use this stage for due diligence and pilot planning.' },
    ],
  }
}

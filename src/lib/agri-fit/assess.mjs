// Route screening for Nigerian agribusiness. Thresholds are questionnaire
// categories and screening assumptions, not market prices or return estimates.
export const routes = [
  {
    id: 'services', name: 'Agricultural services',
    fit: 'Use existing skills to solve a specific problem for farms or agribusinesses.',
    goal: ['cashflow', 'buildBusiness'], skills: ['services', 'operations'],
    cashCycles: ['short', 'medium', 'long'],
    checks: [],
    validate: 'Interview three potential clients and agree the scope and fee for one small paid pilot.',
  },
  {
    id: 'trade', name: 'Buyer-led aggregation and distribution',
    fit: 'Source a product against a buyer specification and earn on reliable delivery.',
    goal: ['cashflow', 'buildBusiness'], skills: ['sales', 'operations'],
    cashCycles: ['short', 'medium', 'long'],
    checks: [['buyerAccess', 'Confirm a buyer, quality specifications, rejection rules and payment terms.']],
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
    validate: 'Have an independent adviser review land tenure and build a cash budget through establishment and early production.',
  },
]

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

  if (answers.capitalPosition === 'noRiskCapital' || (answers.funding === 'borrowed' && answers.lossTolerance === 'low')) {
    return {
      status: 'prepare', shortlist: [], revisit: [],
      nextStep: 'Protect household reserves. Interview buyers or operators and build a pilot budget before committing money.',
    }
  }
  if (answers.role === 'passive') {
    return {
      status: 'prepare', shortlist: [], revisit: [],
      nextStep: 'Define who will operate the business and how you would verify their track record, reporting and use of funds. Reassess after defining your oversight role.',
    }
  }

  const assessed = routes.map(route => {
    const reasons = [route.fit]
    let score = 0
    if (route.goal.includes(answers.goal)) {
      score += 3
      reasons.push('Matches your stated business goal.')
    }
    if (route.skills.includes(answers.skills)) {
      score += 2
      reasons.push('Builds on experience you already have.')
    }

    const blockers = route.checks.filter(([key]) => !answers[key]).map(([, message]) => message)
    if (!route.cashCycles.includes(answers.cashHorizon)) {
      blockers.push('Your cash deadline is too short to depend on this route.')
    }
    if (route.id === 'perennial' && answers.capitalPosition === 'pilotOnly') {
      blockers.push('Budget separately for establishment and operations before considering this route.')
    }
    if (answers.oversight === 'remote' && !answers.operatingCoverage && route.id !== 'services') {
      blockers.push('Arrange local oversight and reporting before running this route remotely.')
    }
    if (answers.lossTolerance === 'low' && ['production', 'perennial', 'processing'].includes(route.id)) {
      blockers.push('Confirm a small pilot with a firm loss limit before taking on production or equipment costs.')
    }
    if (answers.funding === 'borrowed' && route.id !== 'services') {
      blockers.push('Stress-test repayments against late sales and lower volumes before relying on borrowed funds.')
    }
    if (answers.weeklyHours < 5 && !answers.operatingCoverage) {
      blockers.push('Set aside more time or put reliable operational support in place.')
    }
    return { id: route.id, name: route.name, score, reasons, blockers, nextStep: route.validate }
  }).sort((a, b) => b.score - a.score)

  const shortlist = assessed.filter(item => !item.blockers.length && item.score > 0).slice(0, 3)
  return {
    status: shortlist.length ? 'shortlist' : 'prepare',
    shortlist,
    revisit: assessed.filter(item => item.blockers.length).slice(0, 3),
    nextStep: shortlist[0]?.nextStep || 'Address the prerequisites on the closest route and rerun the assessment before committing money.',
  }
}

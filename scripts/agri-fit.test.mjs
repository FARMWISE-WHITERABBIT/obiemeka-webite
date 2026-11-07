import test from 'node:test'
import assert from 'node:assert/strict'
import { assessAgribusinessFit as assess } from '../src/lib/agri-fit/assess.mjs'

const profile = {
  goal: 'cashflow', role: 'operator', cashHorizon: 'short',
  capitalPosition: 'pilotOnly', skills: 'sales', weeklyHours: 12,
  buyerAccess: true, siteAccess: false, operatingCoverage: false,
  funding: 'ownFunds', lossTolerance: 'moderate', oversight: 'local',
}

test('Buyer-led trade ranks first for a short-horizon profile with sales experience', () => {
  assert.equal(assess(profile).shortlist[0].id, 'trade')
})

test('Trade is deferred when the buyer or local oversight is missing', () => {
  for (const answers of [{ buyerAccess: false }, { oversight: 'remote' }]) {
    const report = assess({ ...profile, ...answers })
    assert.ok(!report.shortlist.some(route => route.id === 'trade'))
    assert.ok(report.revisit.some(route => route.id === 'trade' && route.blockers.length > 0))
  }
})

test('A legacy profile with operating resources can shortlist perennials', () => {
  const report = assess({
    ...profile, goal: 'legacy', cashHorizon: 'long', capitalPosition: 'canFundOperations',
    skills: 'production', siteAccess: true, operatingCoverage: true,
  })
  assert.equal(report.shortlist[0].id, 'perennial')
})

test('The assessment can recommend preparation over committing capital', () => {
  for (const answers of [
    { role: 'passive' }, { capitalPosition: 'noRiskCapital' },
    { funding: 'borrowed', lossTolerance: 'low' },
  ]) {
    const report = assess({ ...profile, ...answers })
    assert.equal(report.status, 'prepare')
    assert.deepEqual(report.shortlist, [])
  }
})

test('Out-of-range time and missing screening answers are rejected', () => {
  assert.throws(() => assess({ ...profile, weeklyHours: -1 }), TypeError)
  assert.throws(() => assess({ ...profile, operatingCoverage: undefined }), TypeError)
})

test('Processing plans distinguish plantain chips from coconut oil', () => {
  const processor = { ...profile, cashHorizon: 'medium', processingSetup: 'contract', feedstockAccess: true }
  const chips = assess({ ...processor, processingProduct: 'plantainChips' })
  const oil = assess({ ...processor, processingProduct: 'coconutOil' })
  assert.equal(chips.shortlist[0].id, 'processing')
  assert.match(chips.plan[1].action, /sellable pack/)
  assert.equal(oil.shortlist[0].id, 'processing')
  assert.match(oil.plan[1].action, /saleable litre/)
  assert.notEqual(chips.plan[0].action, oil.plan[0].action)
})

test('Processing interest does not override raw-material and facility gaps', () => {
  const report = assess({
    ...profile, cashHorizon: 'medium', processingProduct: 'plantainChips',
    processingSetup: 'inHouse', feedstockAccess: false,
  })
  assert.ok(!report.shortlist.some(route => route.id === 'processing'))
  const processing = report.revisit.find(route => route.id === 'processing')
  assert.ok(processing.blockers.some(reason => reason.includes('raw-material supply')))
  assert.ok(processing.blockers.some(reason => reason.includes('processing site')))
})

test('A quoted palm mill plan above available capital is deferred', () => {
  const report = assess({
    ...profile, cashHorizon: 'medium', capitalPosition: 'canFundOperations',
    processingProduct: 'palmOil', processingSetup: 'inHouse', feedstockAccess: true,
    siteAccess: true, operatingCoverage: true,
    budget: { currency: 'NGN', available: 3_000_000, setup: 2_500_000, working: 1_000_000 },
  })
  assert.ok(!report.shortlist.some(route => route.id === 'processing'))
  assert.ok(report.revisit.some(route => route.id === 'processing' && route.blockers.some(reason => reason.includes('available capital'))))
  assert.match(report.capital.join(' '), /500,000/)
  assert.match(report.capital.join(' '), /850,000/)
})

test('A chocolate pilot with dollar quotes gives product and location-specific next steps', () => {
  const report = assess({
    ...profile, cashHorizon: 'medium', skills: 'processing',
    processingProduct: 'chocolate', processingSetup: 'contract', feedstockAccess: true,
    budget: { currency: 'USD', available: 2000, setup: 500, working: 800 },
    region: 'Ondo State',
  })
  assert.equal(report.shortlist[0].id, 'processing')
  assert.match(report.capital.join(' '), /1,300/)
  assert.match(report.plan[0].action, /bean-to-bar/)
  assert.match(report.plan[1].action, /Ondo State/)
})

test('Aquaculture and land partnerships get different guidance', () => {
  const fish = assess({ ...profile, cashHorizon: 'medium', enterpriseInterest: 'aquaculture',
    skills: 'livestock', siteAccess: true, operatingCoverage: true })
  assert.equal(fish.shortlist[0].id, 'aquaculture')
  assert.match(fish.plan[0].action, /fingerling/)
  const land = assess({ ...profile, role: 'landPartner' })
  assert.equal(land.status, 'prepare')
  assert.match(land.plan[0].action, /title/)
})

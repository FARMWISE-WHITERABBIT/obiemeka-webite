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

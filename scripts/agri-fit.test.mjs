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

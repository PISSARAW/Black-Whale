import assert from 'node:assert/strict'

export function validateSolarReport(report) {
  assert.equal(report.winner, 'opponent')
  assert.equal(report.finalHealth.player, 0)
  assert.equal(report.continuity.resets, 0)
  assert.equal(report.continuity.backwards, false)
  assert.equal(report.continuity.healed, false)
  assert.ok(
    report.audit.every((e) => e.kind !== 'command' || e.accepted),
    'Every command must execute',
  )
  assert.ok(report.maximumPain >= 90, 'Pain Packer must fill through real injuries')
  assert.ok(
    report.audit.some((e) => e.kind === 'impact' && e.attacker === 'opponent' && e.counterHit),
    'Tserriednich must counter',
  )
  assert.ok(report.maxCombo.player >= 2 && report.maxCombo.opponent >= 2)
  assert.ok(report.confirmedCombos >= 10)
  assert.equal(report.predictedFrames, 600)
  assert.equal(report.predictedHealth, 0, 'The unaltered future must be fatal')
  assert.equal(report.solarDamageTaken, 0, 'Tserriednich must physically escape all heat pulses')
  assert.equal(report.divergenceFrames, 600, 'The full ten-second divergence must finish')
  assert.ok(report.maximumDivergence > 15)
  for (const kind of [
    'pain-packer-equipped',
    'rising-sun-ignited',
    'laplace-vision',
    'laplace-diverging',
    'rising-sun-expired',
    'laplace-ended',
  ])
    assert.ok(
      report.solarEvents.some((e) => e.kind === kind),
      `Missing ${kind}`,
    )
  const sunEnd = report.solarEvents.find((e) => e.kind === 'rising-sun-expired')
  const futureEnd = report.solarEvents.find((e) => e.kind === 'laplace-ended')
  const lastHit = report.audit.filter((e) => e.kind === 'impact').at(-1)
  assert.ok(lastHit.second > sunEnd.second && lastHit.second > futureEnd.second)
  assert.ok(sunEnd.age >= sunEnd.duration, 'Rising Sun must expire naturally')
}

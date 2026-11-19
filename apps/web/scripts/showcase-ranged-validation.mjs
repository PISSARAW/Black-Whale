import assert from 'node:assert/strict'
export function validateRangedDuel(report) {
  assert.equal(report.winner, 'player')
  assert.equal(report.stageId, 'princes-burial-chamber')
  assert.equal(report.continuity.resets, 0)
  assert.equal(report.continuity.backwards, false)
  assert.equal(report.continuity.healed, false)
  assert.ok(report.audit.every((e) => e.kind !== 'command' || e.accepted))
  assert.ok(report.remoteHits.filter((e) => e.damage > 0).length >= 3)
  assert.ok(report.projectilesEmitted >= 60)
  assert.ok(report.rangedSeconds >= 10 && report.closeSeconds >= 8)
  assert.ok(report.confirmedCombos >= 10)
  assert.ok(report.maxIdleSeconds <= 1.5)
  const final = report.remoteHits.at(-1)
  assert.equal(final.interruptedMove, 'franklin:finisher')
  assert.ok(final.franklinShotsFired > 0)
  assert.equal(report.finalHealth.opponent, 0)
  assert.ok(report.duration >= 35 && report.duration <= 75)
  if (report.rangedDynamic) {
    assert.ok(report.confirmedCombos >= 30)
    assert.ok(report.reversals.length >= 5)
    assert.ok(report.closeups.leorioFaceSeconds >= 8 && report.closeups.franklinFaceSeconds >= 6)
    assert.ok(report.closeups.remoteSeconds >= 1 && report.closeups.barrageSeconds >= 3)
  }
}

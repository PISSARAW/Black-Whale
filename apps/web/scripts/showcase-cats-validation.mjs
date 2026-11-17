import assert from 'node:assert/strict'
export function validateCatsReport(report) {
  assert.ok(report.apparentKnockoutSecond >= 28 && report.apparentKnockoutSecond <= 32)
  assert.equal(report.continuity.resets, 0)
  assert.equal(report.continuity.backwards, false)
  assert.equal(report.winner, 'opponent')
  assert.equal(report.finalHealth.player, 0)
  assert.equal(report.finalHealth.opponent, report.initialHealth)
  assert.ok(report.chrolloHealthBeforeCat > report.initialHealth * 0.8)
  assert.equal(report.catFrames, 120)
  assert.equal(report.chrolloConsumed, true)
  assert.equal(report.heals.length, 1)
  assert.ok(report.heals.every((e) => e.nativeResurrection))
  assert.ok(report.contactsBySide.player >= 35)
  assert.ok(report.contactsBySide.opponent >= 3 && report.contactsBySide.opponent <= 5)
  assert.ok(report.confirmedCombos >= 15)
  assert.deepEqual(report.emptyStrikes, [])
  assert.ok(report.audit.every((e) => e.kind !== 'command' || e.accepted))
  assert.deepEqual(
    report.storyEvents.map((e) => e.kind),
    ['cat-summon', 'cat-capture', 'cat-absorb', 'cat-revive', 'cat-consumed', 'cat-complete'],
  )
  assert.ok(!report.moves.includes('chrollo:forwardSpecial'))
}

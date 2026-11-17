import assert from 'node:assert/strict'

export function validateJudgmentReport(report) {
  assert.equal(report.winner, 'opponent')
  assert.equal(report.finalHealth.player, 0)
  assert.equal(report.continuity.resets, 0)
  assert.equal(report.continuity.backwards, false)
  assert.equal(report.continuity.healed, false)
  assert.ok(
    report.audit.every((e) => e.kind !== 'command' || e.accepted),
    'Every move must execute',
  )
  assert.equal(
    report.emptyStrikes.length,
    0,
    'Every executed strike must connect or pressure a guard',
  )
  assert.ok(report.confirmedCombos >= 20)
  assert.ok(report.maxCombo.player >= 2 && report.maxCombo.opponent >= 2)
  for (const technique of ['ten', 'ren', 'ryu'])
    assert.ok(report.biscuitTechniques.includes(technique))
  assert.ok(report.storyEvents.filter((e) => e.kind === 'yellow-card').length >= 2)
  assert.ok(report.storyEvents.filter((e) => e.kind === 'cross-game-restrained').length >= 2)
  assert.ok(report.storyEvents.some((e) => e.kind === 'biscuit-transformed'))
  assert.ok(report.counterHits.length >= 1)
  for (const side of ['player', 'opponent'])
    assert.ok(
      report.counterHits.some((hit) => hit.attacker === side),
      'Both fighters must counter an actual commitment',
    )
  const transformation = report.storyEvents.find(
    (event) => event.kind === 'biscuit-transformed',
  ).second
  const released = report.storyEvents
    .filter((event) => event.kind === 'cross-game-released')
    .at(-1).second
  const biscuitOn = report.storyEvents.find(
    (event) => event.kind === 'on-command' && event.side === 'opponent',
  ).second
  const mizaistomOn = report.storyEvents.find(
    (event) => event.kind === 'on-command' && event.side === 'player',
  ).second
  assert.ok(released < transformation && transformation < biscuitOn && biscuitOn < mizaistomOn)
  assert.ok(report.audit.find((event) => event.kind === 'command').move.startsWith('mizaistom:'))
  for (const side of ['player', 'opponent']) {
    assert.ok(
      report.storyEvents.some((e) => e.kind === 'on-command' && e.side === side && e.accepted),
    )
    assert.ok(report.onHits[side] >= 2)
  }
  assert.ok(report.simultaneousOnSeconds >= 3)
  assert.ok(report.trueFormAtVictory)
  assert.ok(report.bothOnAtVictory, 'The final duel must end while both On contracts burn')
}

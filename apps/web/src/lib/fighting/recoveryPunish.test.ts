import type { FightState } from './types'
import { withRecoveryObservations } from './recoveryObservation'
import { styleReactionFrames } from './styleMobility'
import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { hasRecoveryCancel, recoveryPunishOptions } from './recoveryPunish'
import { attackData } from './frameData'
function recovery(id: (typeof FIGHTING_ROSTER)[number]['id']): FightState {
  let s = beginFight(createFight('phinks', id, { mode: 'versus-local' }))
  s = {
    ...s,
    player: { ...s.player, hatsuEffects: { ...s.player.hatsuEffects, cyclotronTurns: 2 } },
  }
  s = performAuraAttack({
    state: s,
    side: 'player',
    kind: 'special',
    moveId: 'phinks:finisher',
    auraCharged: false,
  })
  const d = attackData('special', s.player)
  return {
    ...s,
    player: { ...s.player, x: 48, attack: { ...s.player.attack!, frame: d.startup + d.active } },
    opponent: { ...s.opponent, x: 52 },
  }
}
it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s measures startup, approach and response time from a visible recovery',
  (id) => {
    const s = recovery(id),
      copy = structuredClone(s),
      options = recoveryPunishOptions(s, 'opponent')
    expect(options.length).toBeGreaterThan(0)
    for (const o of options) {
      expect(o.arrival).toBeLessThanOrEqual(o.frames)
      expect(o.margin).toBeGreaterThanOrEqual(0)
    }
    expect(recoveryPunishOptions({ ...s, opponent: { ...s.opponent, x: 90 } }, 'opponent')).toEqual(
      [],
    )
    expect(
      recoveryPunishOptions({ ...s, opponent: { ...s.opponent, hitStun: 5 } }, 'opponent'),
    ).toEqual([])
    expect(
      recoveryPunishOptions(
        { ...s, opponent: { ...s.opponent, parallelEyesClosed: true } },
        'opponent',
      ),
    ).toEqual([])
    expect(s).toEqual(copy)
  },
)
it('never labels a cancellable confirmed string as an unconditional punish', () => {
  let s = beginFight(createFight('phinks', 'hisoka', { mode: 'versus-local' }))
  s = performAuraAttack({
    state: s,
    side: 'player',
    kind: 'heavy',
    moveId: 'phinks:standingHeavy',
    auraCharged: false,
  })
  const d = attackData('heavy', s.player)
  s = {
    ...s,
    player: {
      ...s.player,
      attack: { ...s.player.attack!, frame: d.startup + d.active, confirmedHit: true },
    },
  }
  expect(hasRecoveryCancel(s.player)).toBe(true)
  expect(recoveryPunishOptions(s, 'opponent')).toEqual([])
})

it('waits for observed reaction time once, then permits the actual recovery punish in either seat', () => {
  let s = recovery('hisoka')
  const first = recoveryPunishOptions(s, 'opponent')
  expect(first.every((o) => o.reaction > 0)).toBe(true)
  const delay = styleReactionFrames(s.opponent)
  for (let i = 0; i < delay; i++) {
    s = withRecoveryObservations(s)
    s = {
      ...s,
      player: { ...s.player, attack: { ...s.player.attack!, frame: s.player.attack!.frame + 1 } },
    }
  }
  const ready = recoveryPunishOptions(s, 'opponent')
  expect(ready.some((o) => o.reaction === 0 && o.arrival <= o.frames)).toBe(true)
  const hidden = withRecoveryObservations({
    ...s,
    opponent: { ...s.opponent, parallelEyesClosed: true },
  })
  expect(hidden.opponent.recoveryWatch).toBeUndefined()
})

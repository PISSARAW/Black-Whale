import { expect } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { multiCommand, multiActive } from './fourCombatTestKit'
import { hatsuFor } from './hatsu'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { advanceProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import type { FightState, FightSide } from './types'

export function soulDuel(side: FightSide = 'player'): FightState {
  const s = beginFight(
    createFight(
      side === 'player' ? 'halkenburg' : 'benjamin',
      side === 'player' ? 'benjamin' : 'halkenburg',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: { mode: 'scenario', resources: ['sedatives'], cohorts: [side] },
        },
      },
    ),
  )
  const base = {
    ...s,
    player: { ...s.player, x: 25, aura: 100, health: 81 },
    opponent: { ...s.opponent, x: 65, aura: 63, health: 47 },
  }
  return multiCommand(base, { action: 'halkenburg-mode', target: 'souls' }, side)
}
export function soulShot(base = soulDuel(), self = true, side: FightSide = 'player'): FightState {
  for (let rng = 1; rng < 100; rng++) {
    const prepared = {
      ...base,
      rng,
      [side]: {
        ...base[side],
        hatsuEffects: { ...base[side].hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
      },
    }
    const cast = performMove({ state: prepared, side, action: 'special' })
    if ((cast[side].halkenburgSupporter === `self:${side}`) !== self) continue
    expect(cast[side].attack).not.toBeNull()
    return hatsuFor('halkenburg').onFrame(multiActive(cast, side))
  }
  throw Error('Expected a selectable real participant')
}
export function soulHit(base = soulDuel(), self = true, side: FightSide = 'player'): FightState {
  let s = soulShot(base, self, side)
  for (let i = 0; i < 40 && !s.halkSoulLinks?.length; i++) {
    const step = advanceProjectiles(s, 1 / 60)
    s = resolveFightImpacts(step.state, step.hits)
  }
  expect(s.halkSoulLinks).toHaveLength(1)
  return s
}

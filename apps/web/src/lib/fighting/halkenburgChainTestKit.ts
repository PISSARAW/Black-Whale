import { expect } from 'vitest'
import { multiActive, multiCommand } from './fourCombatTestKit'
import { soulDuel, soulHit } from './halkenburgSoulTestKit'
import { hatsuFor } from './hatsu'
import { advanceProjectiles } from './projectiles'
import { resolveFightImpacts } from './combatImpact'
import { resolveRosterProjectileHits } from './rosterGuestContacts'
import { createTeamFight, startTeamFight } from './teamMatch'
import type { FightSide, FightState } from './types'

/** Use the actual retained-bow command, committed lottery and travelling projectile. */
export function chainShot(base: FightState, side: FightSide = 'player'): FightState {
  for (let rng = 0; rng < 100; rng++) {
    const prepared = {
      ...base,
      rng,
      [side]: {
        ...base[side],
        attack: null,
        hatsuEffects: { ...base[side].hatsuEffects, cohortWillFrames: 480 },
      },
    }
    const cast = multiCommand(prepared, { action: 'halkenburg-arrow', target: 'low' }, side)
    if (cast === prepared || cast[side].halkenburgSupporter !== `self:${side}`) continue
    return hatsuFor('halkenburg').onFrame(multiActive(cast, side))
  }
  throw Error('Expected the actual mind to participate in its shot')
}
export function landChainShot(shot: FightState): FightState {
  const expected = (shot.halkSoulLinks?.length ?? 0) + 1
  let state = shot
  for (let i = 0; i < 60 && (state.halkSoulLinks?.length ?? 0) < expected; i++) {
    const step = advanceProjectiles(state, 1 / 60)
    state = resolveFightImpacts(
      resolveRosterProjectileHits(step.state, step.hits),
      step.hits.filter((hit) => !hit.targetBody && !hit.projectile.sourceBody),
    )
  }
  expect(state.halkSoulLinks).toHaveLength(expected)
  return state
}
export function threeSoulBodies(): FightState {
  const initial = soulHit(soulDuel(), false)
  // Put the real sleeping supporter body in the next shot's line of fire.
  const aligned = {
    ...initial,
    player: { ...initial.player, x: 25, facing: 1 as const },
    opponent: { ...initial.opponent, x: 65 },
    rosterGuests: initial.rosterGuests!.map((guest) => ({
      ...guest,
      fighter: { ...guest.fighter, x: 85 },
    })),
  }
  return landChainShot(chainShot(aligned))
}
export function soulTeam(side: FightSide = 'player'): FightState {
  const rosters = {
    player: ['halkenburg', 'hisoka', 'theta'],
    opponent: ['benjamin', 'shizuku', 'leorio'],
  } as const
  let state = startTeamFight(
    createTeamFight(
      side === 'player'
        ? { player: [...rosters.player], opponent: [...rosters.opponent] }
        : { player: [...rosters.opponent], opponent: [...rosters.player] },
      {
        preparation: { mode: 'scenario', resources: ['sedatives'], cohorts: [side] },
      },
    ),
  )
  state = {
    ...state,
    player: { ...state.player, x: 25, health: 81, aura: 100 },
    opponent: { ...state.opponent, x: 65, health: 47, aura: 100 },
  }
  return multiCommand(state, { action: 'halkenburg-mode', target: 'souls' }, side)
}

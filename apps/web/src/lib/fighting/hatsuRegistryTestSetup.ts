import { beginFight, createFight, tickFight } from './engine'
import { hatsuFor } from './hatsu/registry'
import { EMPTY_INPUT, type FightProjectile, type FightState } from './types'

export function advance(state: FightState, seconds: number): FightState {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, EMPTY_INPUT, 0.02)
  }
  return next
}

export function closeFight(
  player: Parameters<typeof createFight>[0],
  opponent: Parameters<typeof createFight>[1],
) {
  const state = beginFight(createFight(player, opponent))
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 54, aura: 100, hitStun: 90 },
  }
}

export const SAMPLE_PROJECTILE = {
  id: 0,
  owner: 'opponent',
  fighterId: 'theta',
  x: 50,
  y: 6.1,
  velocityX: -50,
  width: 0.7,
  height: 0.5,
  damage: 8,
  hitstun: 13,
  blockstun: 9,
  hitstop: 5,
  knockback: 2.2,
  targetZone: 'torso',
  shape: 'stone',
  colour: '#81715f',
  age: 0,
  lifetime: 120,
  matter: 'object',
} satisfies FightProjectile

export function chrolloStrike(state: FightState, slot: string, blocked = false): FightState {
  return hatsuFor('chrollo').onImpact({
    state,
    side: 'player',
    defenderSide: 'opponent',
    source: 'chrollo',
    moveId: `chrollo:${slot}`,
    blocked,
    concealed: false,
  })
}

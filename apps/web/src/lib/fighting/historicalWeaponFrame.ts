import { attackPhase } from './frameData'
import { commitProjectileNen } from './nenProjectiles'
import { historicalWeaponReady, historicalBladeStrike } from './historicalWeapons'
import type { FightProjectile, FightSide, FightState } from './types'

export function advanceHistoricalWeapons(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side],
      poison = actor.paralyticPoison
    if (poison) {
      const age = poison.age + 1,
        frames = poison.frames - 1
      const paralyzed = frames > 0 && age >= 30 && !poison.contained
      state = {
        ...state,
        [side]: {
          ...actor,
          paralyticPoison: frames > 0 ? { ...poison, age, frames } : undefined,
          ...(paralyzed
            ? { hitStun: Math.max(2, actor.hitStun), attack: null, bufferedAttack: null }
            : {}),
        },
      }
    }
    state = advanceThrow(state, side)
  }
  return state
}
function advanceThrow(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    weapon = actor.historicalWeaponThrow
  if (!weapon) return state
  if (!actor.attack || !historicalWeaponReady(actor))
    return { ...state, [side]: { ...actor, historicalWeaponThrow: undefined } }
  if (actor.attack.projectileSpawned || attackPhase(actor) !== 'active') return state
  const projectile: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: actor.id,
    x: actor.x + actor.facing * 3,
    y: actor.y + 6,
    velocityX: actor.facing * 76,
    width: 0.85,
    height: 0.22,
    damage: 10,
    hitstun: 13,
    blockstun: 9,
    hitstop: 4,
    knockback: 2,
    targetZone: 'torso',
    guard: 'mid',
    matter: 'object',
    shape: 'needle',
    colour: '#d1d5db',
    age: 0,
    lifetime: 120,
    physicalBlade: { weapon },
    illusionHarmless: Boolean(actor.futureIllusionActive),
  }
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [...state.projectiles, commitProjectileNen(projectile, actor)],
    [side]: {
      ...actor,
      historicalWeapon: undefined,
      historicalWeaponSpent: true,
      attack: { ...actor.attack, projectileSpawned: true, impacted: true },
    },
  }
}

export function recordHistoricalWeaponHit(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  if (!historicalBladeStrike(before[side]) || before[side].historicalWeapon !== 'ben-knife')
    return after
  return landedCut(after) ? poisonTarget(after, side) : after
}
export function recordHistoricalBladeProjectile(
  state: FightState,
  shot: FightProjectile,
): FightState {
  if (
    !cuttingPhysicalProjectile(shot) ||
    !landedCut(state) ||
    state.impact?.projectileId !== shot.id
  )
    return state
  const target = shot.owner === 'player' ? 'opponent' : 'player'
  state = {
    ...state,
    [target]: { ...state[target], openWounds: (state[target].openWounds ?? 0) + 1 },
  }
  return shot.physicalBlade?.weapon === 'ben-knife' ? poisonTarget(state, shot.owner) : state
}
function cuttingPhysicalProjectile(shot: FightProjectile): boolean {
  return Boolean(
    shot.physicalBlade ||
    (shot.fighterId === 'feitan' && shot.matter === 'object' && shot.shape === 'bullet'),
  )
}
function landedCut(state: FightState): boolean {
  const hit = state.impact
  return Boolean(hit && !hit.blocked && !hit.avoided && !hit.transfer && hit.damage > 0)
}
function poisonTarget(state: FightState, owner: FightSide): FightState {
  const target = owner === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [target]: {
      ...state[target],
      paralyticPoison: { owner, age: 0, frames: 180, contained: false },
    },
  }
}

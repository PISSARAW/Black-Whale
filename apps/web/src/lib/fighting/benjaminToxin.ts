import { canAct } from './fightActorState'
import { priorityLineOfSight } from './priorityOptics'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import type { FightSide, FightState } from './types'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'

/** Fictional TSK-17 scenario equipment. All clocks/radii below are duel tuning. */
export const TOXIN_COMA_FRAME = 3000
export const TOXIN_FATAL_FRAME = 3600
declare module './types' {
  interface ArcadeFighter {
    toxinChargeSpent?: boolean
    toxinExposure?: { owner: FightSide; age: number }
  }
  interface FightState {
    toxinClouds?: { owner: FightSide; x: number; y: number; frames: number }[]
  }
}
export function performBenjaminToxin({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (command.action !== 'benjamin-toxin' || !toxinEquipmentReady(state, side)) return state
  return {
    ...state,
    toxinClouds: [
      ...(state.toxinClouds ?? []),
      { owner: side, x: actor.x, y: actor.y, frames: 240 },
    ],
    [side]: { ...actor, toxinChargeSpent: true, arenaRecovery: 18 },
  }
}
function toxinEquipmentReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    state.environment.preparation?.mode === 'scenario' &&
    actor.id === 'benjamin' &&
    !actor.nenOwner &&
    !actor.toxinChargeSpent &&
    canAct(actor) &&
    !actor.attack
  )
}
export function advanceBenjaminToxin(state: FightState): FightState {
  if (!state.toxinClouds?.length && !state.player.toxinExposure && !state.opponent.toxinExposure)
    return state
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceExposure(next, side)
  const clouds = (next.toxinClouds ?? [])
    .filter((c) => c.frames > 1)
    .map((c) => ({ ...c, frames: c.frames - 1 }))
  next = { ...next, toxinClouds: clouds.length ? clouds : undefined }
  return next.deaths !== state.deaths ? resolveFightOutcome(next) : next
}
function advanceExposure(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (actor.health <= 0) return state
  const cloud = (state.toxinClouds ?? []).find((c) => exposesBody(state, side, c))
  const exposure = actor.toxinExposure ?? (cloud ? { owner: cloud.owner, age: 0 } : undefined)
  if (!exposure) return state
  const age = exposure.age + 1
  const next = {
    ...state,
    [side]: {
      ...actor,
      toxinExposure: { ...exposure, age },
      ...(age >= TOXIN_COMA_FRAME
        ? { hitStun: Math.max(2, actor.hitStun), attack: null, bufferedAttack: null }
        : {}),
      health: age >= TOXIN_FATAL_FRAME ? 0 : actor.health,
    },
  }
  return recordFightDeath(next, { victimSide: side, killerSide: exposure.owner, cause: 'toxin' })
}
function exposesBody(
  state: FightState,
  side: FightSide,
  cloud: NonNullable<FightState['toxinClouds']>[number],
): boolean {
  const actor = state[side]
  if (cloud.frames <= 0 || Math.hypot(actor.x - cloud.x, actor.y - cloud.y) > 6) return false
  return priorityLineOfSight(state, {
    x: cloud.x,
    y: cloud.y + 2,
    targetX: actor.x,
    targetY: actor.y + 2,
  })
}
export function benjaminToxinOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'benjamin') return []
  return [
    {
      command: { action: 'benjamin-toxin' },
      ready: toxinEquipmentReady(state, side),
      labelFr: 'Équipement de scénario · TSK-17',
      labelEn: 'Scenario equipment · TSK-17',
      conditionFr:
        'Arme matérielle des ch. 416–417, disponible une fois en scénario. Nuage local, exposition réelle y compris du porteur, coma puis décès attribué ; aucun effet de Nen copié. Durées, rayon et stock sont des réglages de duel, sans simulation biologique.',
      conditionEn:
        'Physical equipment from ch. 416–417, once per scenario. Local cloud, actual exposure including the carrier, coma then attributed death; no copied Nen effect. Timing, radius and stock are duel tuning, without a biological simulation.',
    },
  ]
}

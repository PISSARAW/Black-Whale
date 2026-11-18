import { canAct } from './fightActorState'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Feitan distracts Zazan with the opened physical umbrella; no guaranteed hit follows. */
export const UMBRELLA_OPEN_FRAMES = 10
export const UMBRELLA_FEINT_FRAMES = 54
export const UMBRELLA_RADIUS = 4.5
export interface UmbrellaRay {
  x: number
  y: number
  targetX: number
  targetY: number
}
declare module './types' {
  interface ArcadeFighter {
    umbrellaFeintFrames?: number
  }
}

export function performUmbrellaFeint({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (command.action !== 'umbrella-feint' || actor.id !== 'feitan') return state
  if (state.phase !== 'fighting' || state.catsName || !canAct(actor) || actor.attack) return state
  if (actor.weaponsConfiscated || actor.umbrellaFeintFrames) return state
  return {
    ...state,
    [side]: {
      ...actor,
      umbrellaFeintFrames: UMBRELLA_FEINT_FRAMES,
      arenaRecovery: UMBRELLA_OPEN_FRAMES,
      blocking: false,
    },
  }
}
export function advanceUmbrellaFeints(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side]
    if (!actor.umbrellaFeintFrames) continue
    const remaining = umbrellaInterrupted(actor) ? 0 : actor.umbrellaFeintFrames - 1
    next = { ...next, [side]: { ...actor, umbrellaFeintFrames: remaining || undefined } }
  }
  return next
}
function umbrellaInterrupted(actor: ArcadeFighter): boolean {
  return (
    actor.health <= 0 ||
    actor.weaponsConfiscated === true ||
    actor.hitStun > 0 ||
    actor.knockdownFrames > 0
  )
}

export function umbrellaCanopy(actor: ArcadeFighter) {
  const frames = actor.umbrellaFeintFrames ?? 0
  if (!frames || umbrellaInterrupted(actor)) return null
  return {
    x: actor.x + actor.facing * 3,
    y: actor.y + 9,
    radius: UMBRELLA_RADIUS,
    opened: frames <= UMBRELLA_FEINT_FRAMES - UMBRELLA_OPEN_FRAMES,
  }
}
export function umbrellaBlocksRay(actor: ArcadeFighter, ray: UmbrellaRay): boolean {
  const canopy = umbrellaCanopy(actor),
    gap = ray.targetX - ray.x
  if (!canopy?.opened || Math.abs(gap) < 0.001) return false
  const fraction = (canopy.x - ray.x) / gap
  if (fraction <= 0 || fraction >= 1) return false
  const height = ray.y + (ray.targetY - ray.y) * fraction
  return Math.abs(height - canopy.y) <= canopy.radius
}
export function umbrellaBlocksSight(state: FightState, ray: UmbrellaRay): boolean {
  return umbrellaBlocksRay(state.player, ray) || umbrellaBlocksRay(state.opponent, ray)
}
export function umbrellaScreensStrike(actor: ArcadeFighter, observer: ArcadeFighter): boolean {
  const handY = actor.attack?.variant === 'low' ? 3 : 8
  return umbrellaBlocksRay(actor, {
    x: observer.x,
    y: observer.y + 10,
    targetX: actor.x,
    targetY: actor.y + handY,
  })
}
export function umbrellaOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'feitan') return []
  const command = { action: 'umbrella-feint' as const }
  return [
    {
      command,
      ready: performUmbrellaFeint({ state, side, command }) !== state,
      labelFr: 'Parapluie · Feinte visuelle',
      labelEn: 'Umbrella · Visual feint',
      conditionFr:
        'Parapluie matériel porté, ouverture vulnérable. La toile masque la vue dans son axe, sans aveuglement ni coup garanti. La garde et l’esquive restent possibles ; un En couvrant le coup permet de le sentir. Aucun Nen requis. Les durées et dimensions sont des réglages du duel.',
      conditionEn:
        'Carried physical umbrella and vulnerable opening. The canopy obstructs sight along its axis, without blindness or a guaranteed hit. Guard and evasion remain available; En covering the strike can sense it. No Nen required. Durations and dimensions are duel tuning.',
    },
  ]
}

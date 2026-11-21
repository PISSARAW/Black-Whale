import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

/**
 * Halkenburg's bow is a collective weapon, never a personal gauge. A partisan
 * counts only while it physically exists, carries the mark, consents, stands
 * near the archer and is awake to share the will. Reach is a duel tuning value.
 */
export const COHORT_REACH = 40

export function cohortMemberReady(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  return (
    entry.material === 'real' &&
    !entry.copy &&
    Boolean(entry.consenting && entry.feather) &&
    !entry.sleepingFrames &&
    !entry.halkenburgPassenger &&
    Math.abs(entry.x - state[side].x) <= COHORT_REACH
  )
}

/** A landed hit or a fall breaks the concentration that gathers the shared will. */
export function cohortConcentrationBroken(fighter: ArcadeFighter): boolean {
  return fighter.hitStun > 0 || fighter.knockdownFrames > 0
}

/**
 * The material conditions of the shot must still hold at release: the group
 * is still gathered and the drawn participant is still one of its members.
 */
export function halkenburgShotConditionsHold(
  state: FightState,
  side: FightSide,
  cohort: PreparedEntity[],
): boolean {
  const participant = state[side].halkenburgSupporter
  if (!participant || cohort.length === 0) return false
  return participant === `self:${side}` || cohort.some((entry) => entry.id === participant)
}

/** The nocked arrow dissolves; no projectile, no refund of the gathered will. */
export function abandonHalkenburgShot(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  return {
    ...state,
    [side]: {
      ...actor,
      halkenburgSupporter: undefined,
      halkenburgGroupProtection: false,
      halkSoulLowShot: undefined,
      hatsuEffects: { ...actor.hatsuEffects, arrowNocked: 0 },
      attack: actor.attack && { ...actor.attack, projectileSpawned: true, impacted: true },
    },
  }
}

/** A correctly released arrow is not stopped by covers, crates or other world obstacles. */
export function ignoresWorldObstacles(projectile: FightProjectile): boolean {
  return Boolean(projectile.halkenburgArrow)
}

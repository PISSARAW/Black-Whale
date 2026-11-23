import type { ArcadeFighter, FighterDash } from './types'
import { followUpCrossesPushbox } from './moveFollowUpPhysics'

/**
 * Crossing (SIGNATURE_COMBOS.md): a 2D stand-in for the low passes and lateral circling the
 * duel cannot show. A crossing dash ignores the pushboxes, so the body slips past its
 * opponent; hurtboxes, hitboxes and every guard rule stay. Never an invulnerability.
 */
/** A crossing accélération peaks this much faster than the fighter's own dash. Duel tuning. */
export const CROSSING_SPEED = 1.4

export function crossesBody(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.motion?.dash?.through) || followUpCrossesPushbox(fighter)
}

/** Tserriednich, diverging from his own forecast, may slip past the opponent's prediction. */
export function crossingDash(fighter: ArcadeFighter, direction: -1 | 1): Partial<FighterDash> {
  return fighter.futureDiverging && direction === fighter.facing ? { through: true } : {}
}

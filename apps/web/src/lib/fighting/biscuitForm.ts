import type { ArcadeFighter } from './types'

export const BISCUIT_FORM_MOVE = 'biscuit:neutralSpecial'

/** Her muscular body is her natural form, not a timed or stealable Hatsu. */
export function isBiscuitTrueForm(fighter: ArcadeFighter): boolean {
  return fighter.id === 'biscuit' && fighter.biscuitTrueForm === true
}

export function isBiscuitFormMove(fighter: ArcadeFighter, moveId?: string): boolean {
  return fighter.id === 'biscuit' && (moveId === undefined || moveId === BISCUIT_FORM_MOVE)
}

/**
 * Her natural body reaches farther: every strike's reach grows by this factor for the round,
 * with the power (hatsu.ts) and the inertia of her heavier body (fightPhysicalProfile.ts).
 * Duel tuning, not canon.
 */
export const BISCUIT_TRUE_FORM_REACH = 1.12

export function biscuitReach(fighter: ArcadeFighter, reach: number): number {
  return isBiscuitTrueForm(fighter) ? reach * BISCUIT_TRUE_FORM_REACH : reach
}

import type { ArcadeFighter } from './types'

export const BISCUIT_FORM_MOVE = 'biscuit:neutralSpecial'

/** Her muscular body is her natural form, not a timed or stealable Hatsu. */
export function isBiscuitTrueForm(fighter: ArcadeFighter): boolean {
  return fighter.id === 'biscuit' && fighter.biscuitTrueForm === true
}

export function isBiscuitFormMove(fighter: ArcadeFighter, moveId?: string): boolean {
  return fighter.id === 'biscuit' && (moveId === undefined || moveId === BISCUIT_FORM_MOVE)
}

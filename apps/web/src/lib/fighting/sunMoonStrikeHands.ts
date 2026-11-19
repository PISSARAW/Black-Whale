import { chrolloPageForMove, CHROLLO_SECONDARY } from './chrolloBook'
import { objectMarkHandReady, type ObjectMark } from './sunMoonObjectHands'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** The secondary page uses Moon only with the book closed; the primary Sun remains left-handed. */
export function sunMoonStrikeMark(actor: ArcadeFighter, moveId?: string): ObjectMark {
  return moveId === CHROLLO_SECONDARY && !actor.chrolloBook?.open ? 'moon' : 'sun'
}
export function sunMoonStrikeHandReady(
  state: FightState,
  side: FightSide,
  moveId?: string,
): boolean {
  return objectMarkHandReady(state, side, sunMoonStrikeMark(state[side], moveId))
}
/** Native keyboard, AI, buffered and panel strikes must share the same actual hand predicate. */
export function sunMoonStrikeAllowed(
  options: Pick<AuraAttackOptions, 'state' | 'side' | 'kind' | 'moveId'>,
): boolean {
  if (options.kind !== 'special') return true
  if (chrolloPageForMove(options.state[options.side], options.moveId) !== 'sun-and-moon')
    return true
  return sunMoonStrikeHandReady(options.state, options.side, options.moveId)
}

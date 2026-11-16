import { chrolloPageForMove } from './chrolloBook'
import type { FightState, MoveSlot } from './types'

/** Stage a Sun/Moon pair, preserve a useful page, and steal only after observation. */
export function chrolloAiSlots(state: FightState, roll: number, gap: number): readonly MoveSlot[] {
  const fighter = state.opponent
  const book = fighter.chrolloBook
  if (!book) return ['standingLight']
  if (gap > 10) return roll > 0.7 ? ['backSpecial', 'downSpecial'] : ['forwardHeavy']
  if (canSteal(state, gap) && roll > 0.7) return ['forwardSpecial', 'standingLight']
  if (needsMoon(state)) return ['downSpecial', 'standingLight']
  return bookPlan(state, roll)
}

function bookPlan(state: FightState, roll: number): readonly MoveSlot[] {
  const book = state.opponent.chrolloBook!
  if (!book.bookmark && roll > 0.8) return ['downSpecial', 'neutralSpecial']
  if (!book.open && book.bookmark !== 'sun-and-moon' && roll > 0.55)
    return ['backSpecial', 'neutralSpecial']
  return roll > 0.4 ? ['neutralSpecial', 'standingHeavy'] : ['standingLight', 'backHeavy']
}

function canSteal(state: FightState, gap: number): boolean {
  return (
    state.opponent.hatsuEffects.witnessedHatsu === state.player.id &&
    state.player.hatsuEffects.hatsuStolen === 0 &&
    gap <= 6
  )
}

function needsMoon(state: FightState): boolean {
  return (
    chrolloPageForMove(state.opponent) === 'sun-and-moon' &&
    state.player.hatsuEffects.sunMark > 0 &&
    Boolean(state.opponent.chrolloBook?.open)
  )
}

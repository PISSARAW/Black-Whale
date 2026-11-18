import { chrolloPageForMove } from './chrolloBook'
import { hunterInterviewReady } from './skillHunterAcquisition'
import { futurePerceivedTarget } from './parallelFuture'
import type { FightState, MoveSlot } from './types'

/** Stage a Sun/Moon pair, preserve a useful page, and steal only after observation. */
export function chrolloAiSlots(state: FightState, roll: number, gap: number): readonly MoveSlot[] {
  const fighter = state.opponent
  const book = fighter.chrolloBook
  const physical = physicalSlots(roll, gap)
  if (!book) return physical
  const secondary = closedBookSlots(state)
  if (secondary) return secondary
  if (gap > 10) return physical
  if (canSteal(state, gap) && roll > 0.7) return ['forwardSpecial', 'standingLight']
  if (needsMoon(state)) return ['downSpecial', 'standingLight']
  return bookPlan(state, roll, physical)
}

function closedBookSlots(state: FightState): readonly MoveSlot[] | null {
  const book = state.opponent.chrolloBook!
  if (book.open || !book.bookmark) return null
  if (book.bookmark !== 'sun-and-moon') return ['finisher', 'neutralSpecial', 'standingLight']
  return state.player.hatsuEffects.sunMark > 0 ? ['finisher', 'standingLight'] : null
}

function bookPlan(
  state: FightState,
  roll: number,
  physical: readonly MoveSlot[],
): readonly MoveSlot[] {
  const book = state.opponent.chrolloBook!
  if (!book.bookmark && roll > 0.8) return ['downSpecial', 'neutralSpecial']
  if (!book.open && book.bookmark !== 'sun-and-moon' && roll > 0.55)
    return ['backSpecial', 'neutralSpecial']
  return roll > 0.6 ? ['neutralSpecial', ...physical] : [...physical, 'neutralSpecial']
}
function physicalSlots(roll: number, gap: number): readonly MoveSlot[] {
  if (gap > 20) return []
  if (gap > 10) return ['forwardHeavy', 'standingHeavy', 'forwardLight']
  if (roll < 0.35) return ['standingLight', 'forwardLight', 'backHeavy']
  if (roll < 0.7) return ['standingHeavy', 'lowHeavy', 'lowLight']
  return ['backHeavy', 'forwardHeavy', 'standingLight']
}

function canSteal(state: FightState, gap: number): boolean {
  return (
    hunterInterviewReady(state, 'opponent') &&
    state.player.hatsuEffects.hatsuStolen === 0 &&
    gap <= 6
  )
}

function needsMoon(state: FightState): boolean {
  const target = futurePerceivedTarget(state, 'opponent', state.player)
  return (
    chrolloPageForMove(state.opponent) === 'sun-and-moon' &&
    target.hatsuEffects.sunMark > 0 &&
    Boolean(state.opponent.chrolloBook?.open)
  )
}

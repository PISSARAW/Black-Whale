import type { FightState, MoveSlot } from './types'

export function benjaminAiSlots(state: FightState, roll: number, gap: number): readonly MoveSlot[] {
  const utility = utilitySlots(state, roll, gap)
  if (utility) return utility
  if (gap > 10) return ['neutralSpecial', 'forwardHeavy']
  if (roll < 0.35) return ['standingLight', 'forwardLight']
  return ['standingHeavy', 'backSpecial', 'neutralSpecial']
}

function utilitySlots(state: FightState, roll: number, gap: number): readonly MoveSlot[] | null {
  const baton = state.opponent.hatsuEffects.baton
  if (state.player.attack?.kind === 'ranged' && roll > 0.5 && !baton?.card)
    return ['downSpecial', 'standingHeavy']
  if (gap <= 7 && !baton?.markedTarget && roll > 0.8) return ['forwardSpecial', 'standingLight']
  return null
}

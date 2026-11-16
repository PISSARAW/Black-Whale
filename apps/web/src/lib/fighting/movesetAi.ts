import { voconteAiSlots } from './vocontePresentation'
import { biohazardAiSlots } from './biohazardAi'
import { predatorAiSlots } from './predatorAi'
import { benjaminAiSlots } from './benjaminAi'
import { chrolloAiSlots } from './chrolloAi'
import { canUseMovesetMove, finisherReady, moveForSlot, movesetFor } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { FightState, MoveSlot } from './types'

export function chooseMovesetAttack(
  state: FightState,
  roll: number,
  gap: number,
): FighterMove | null {
  const side = 'opponent'
  const fighter = state.opponent
  if (!movesetFor(fighter.id)) return null
  if (finisherReady(state, side) && roll > 0.72 && finisherInRange(state, gap))
    return moveForSlot(fighter.id, 'finisher')
  if (fighter.id === 'benjamin' && gap > 18) return null
  if (fighter.id === 'musse' && gap > 9) return null
  const slots = fighterSlots(state, roll, gap)
  return (
    slots
      .map((slot) => moveForSlot(fighter.id, slot))
      .find((move) => move && canUseMovesetMove(state, side, move)) ?? null
  )
}

function candidateSlots(roll: number, gap: number): readonly MoveSlot[] {
  if (gap > 15) {
    return roll > 0.66
      ? ['forwardSpecial', 'neutralSpecial', 'forwardHeavy']
      : ['forwardHeavy', 'forwardSpecial', 'standingHeavy']
  }
  if (roll < 0.2) return ['lowLight', 'standingLight', 'forwardLight']
  if (roll < 0.42) return ['forwardLight', 'standingLight', 'lowHeavy']
  if (roll < 0.64) return ['standingHeavy', 'forwardHeavy', 'backHeavy']
  if (roll < 0.84) return ['downSpecial', 'forwardSpecial', 'standingHeavy']
  return ['neutralSpecial', 'backSpecial', 'forwardHeavy']
}

function finisherInRange(state: FightState, gap: number): boolean {
  if (state.opponent.id === 'phinks') return gap <= 12
  return state.opponent.id !== 'chrollo' || gap <= 9
}

function fighterSlots(state: FightState, roll: number, gap: number): readonly MoveSlot[] {
  if (state.opponent.id === 'voconte') return voconteAiSlots(state, gap)
  return ordinaryFighterSlots(state, roll, gap)
}

function ordinaryFighterSlots(state: FightState, roll: number, gap: number): readonly MoveSlot[] {
  if (state.opponent.id === 'hinrigh') return biohazardAiSlots(state, roll, gap)
  if (state.opponent.id === 'phinks') return ['standingLight', 'standingHeavy', 'forwardHeavy']
  if (state.opponent.id === 'lynch') return lynchSlots(state, gap)
  if (state.opponent.id === 'rihan') return predatorAiSlots(state)
  if (state.opponent.id === 'musse') return musseSlots(state, gap)
  if (state.opponent.id === 'tserriednich')
    return gap > 10
      ? ['forwardHeavy', 'standingHeavy']
      : ['standingLight', 'standingHeavy', 'lowHeavy']
  if (state.opponent.id === 'benjamin') return benjaminAiSlots(state, roll, gap)
  if (state.opponent.id === 'chrollo') return chrolloAiSlots(state, roll, gap)
  return candidateSlots(roll, gap)
}

function musseSlots(state: FightState, gap: number): readonly MoveSlot[] {
  return gap <= 6 && !state.opponent.secretWindow
    ? ['neutralSpecial', 'standingLight']
    : ['standingLight', 'forwardLight', 'standingHeavy']
}

function lynchSlots(state: FightState, gap: number): readonly MoveSlot[] {
  return !state.opponent.lynchQuestion && gap <= 18
    ? ['neutralSpecial', 'standingLight']
    : ['standingLight', 'forwardLight', 'standingHeavy']
}

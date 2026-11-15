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
  if (finisherReady(state, side) && roll > 0.72) return moveForSlot(fighter.id, 'finisher')
  const slots = candidateSlots(roll, gap)
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

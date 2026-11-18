import type { AuraAttackOptions } from './auraAttackAction'
import { directionalInput, directionalSlot } from './directionalChain'
import { canUseMovesetMove, moveForSlot } from './movesets'
import type { FightInput, FightSide, FightState, MoveAction } from './types'

export function performDirectionalChain(
  command: { state: FightState; side: FightSide; action: MoveAction; input: FightInput },
  perform: (options: AuraAttackOptions) => FightState,
): FightState | undefined {
  const { state, side, action, input } = command
  const fighter = state[side]
  const chain = directionalInput(fighter, action, input)
  if (!chain) return
  const signature = chain === 'carry' ? signatureMove(state, side) : null
  const move = signature ?? moveForSlot(fighter.id, directionalSlot(chain))
  if (move && canUseMovesetMove(state, side, move)) {
    return perform({
      state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: false,
      directionalChain: chain,
    })
  }
  return state
}

function signatureMove(state: FightState, side: FightSide) {
  const fighter = state[side]
  const move = moveForSlot(fighter.id, fighter.id === 'kurapika' ? 'forwardSpecial' : 'finisher')
  return move && canUseMovesetMove(state, side, move) ? move : null
}

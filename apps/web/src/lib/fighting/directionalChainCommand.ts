import type { AuraAttackOptions } from './auraAttackAction'
import { performAirPursuit } from './airPursuitCommand'
import { directionalInput, directionalSlot, type DirectionalEnding } from './directionalChain'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { directionalTechnique } from './directionalTechniques'
import type { FightInput, FightSide, FightState, MoveAction } from './types'

export function performDirectionalChain(
  command: { state: FightState; side: FightSide; action: MoveAction; input: FightInput },
  perform: (options: AuraAttackOptions) => FightState,
): FightState | undefined {
  const pursuit = performAirPursuit(command, perform)
  if (pursuit) return pursuit
  const { state, side, action, input } = command
  const fighter = state[side]
  const chain = directionalInput(fighter, action, input)
  if (!chain) return
  const signature = chain === 'bridge' ? null : signatureMove(state, side, chain)
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

function signatureMove(state: FightState, side: FightSide, ending: DirectionalEnding) {
  const fighter = state[side]
  const slot = directionalTechnique(fighter.id, ending)
  if (!slot) return null
  const move = moveForSlot(fighter.id, slot)
  return move && canUseMovesetMove(state, side, move) ? move : null
}

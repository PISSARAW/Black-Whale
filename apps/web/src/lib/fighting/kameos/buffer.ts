import type { DuelInputs } from '../duelStep/types'
import type { FightInput, FightSide, FightState } from '../types'
import { canCallKameo, kameoCall } from './runtime'

/** Keep a manual call through hitstop without advancing the support or its clocks. */
export function bufferKameoCalls(state: FightState, inputs: DuelInputs): FightState {
  if (!state.kameos || state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const slot = bufferedSlot(next, side, inputs[side])
    if (slot) next = { ...next, kameos: { ...next.kameos, [side]: slot } }
  }
  return next
}

function bufferedSlot(state: FightState, side: FightSide, input?: FightInput) {
  const slot = state.kameos?.[side]
  if (!slot || !input) return
  const call = kameoCall(input, state[side].facing)
  if (!call || call === slot.bufferedCall) return
  if (slot.phase !== 'reserve' || slot.cooldownFrames > 0 || !canCallKameo(state, side, slot))
    return
  return { ...slot, bufferedCall: call }
}

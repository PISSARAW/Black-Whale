import { refusedByScheme } from './controlScheme'
import { futureAcceptsMove } from './parallelFutureAbility'
import type { FightInput, FightSide, FightState, MoveSlot } from './types'

/** A selected move may start: the forecast accepts it and the control scheme does not refuse it. */
export function moveAdmitted(options: {
  state: FightState
  side: FightSide
  input: FightInput
  slot: MoveSlot | undefined
}): boolean {
  const { state, side, input, slot } = options
  return futureAcceptsMove(state, side) && !refusedByScheme(state[side], input, slot)
}

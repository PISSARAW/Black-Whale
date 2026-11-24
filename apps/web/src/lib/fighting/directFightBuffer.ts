import { fightAcceptsCommands } from './fightOutcome'
import type { FightInput, FightSide, FightState } from './types'
import type { TrainingAction } from './trainingTypes'

interface DirectMove {
  side: FightSide
  action: TrainingAction
  input?: FightInput
}
declare module './types' {
  interface FightState {
    directMoveBuffer?: Partial<Record<FightSide, DirectMove>>
  }
}

export function bufferDirectMove(state: FightState, move: DirectMove): FightState | null {
  if (!move.input?.directControls || !fightAcceptsCommands(state)) return null
  if (state.hitstop <= 0 && !state.directMoveBuffer?.[move.side]) return null
  return { ...state, directMoveBuffer: { ...state.directMoveBuffer, [move.side]: move } }
}

export function flushDirectMoves(
  state: FightState,
  execute: (move: DirectMove & { state: FightState }) => FightState,
): FightState {
  const buffer = state.directMoveBuffer
  if (state.hitstop > 0 || !buffer) return state
  let next: FightState = { ...state, directMoveBuffer: undefined }
  if (!fightAcceptsCommands(next)) return next
  for (const side of ['player', 'opponent'] as const) {
    const move = buffer[side]
    if (move) next = execute({ ...move, state: next })
  }
  return next
}

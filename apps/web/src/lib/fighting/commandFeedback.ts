import { commandFailure, type CommandFailure } from './commandFailure'
import type { FightInput, FightSide, FightState } from './types'
import type { TrainingAction } from './trainingTypes'

export interface CommandIntent {
  side: FightSide
  action: TrainingAction | 'utility'
  input?: FightInput
  moveId?: string
}
export interface CommandFeedback {
  frame: number
  sequence: number
  outcome: 'started' | 'buffered' | 'refused'
  reason?: CommandFailure
}
declare module './types' {
  interface FightState {
    commandFeedback?: Partial<Record<FightSide, CommandFeedback>>
  }
}

/** UI attempts only. Engine admission, costs and no-op semantics stay authoritative. */
export function observeFightCommand(
  state: FightState,
  intent: CommandIntent,
  run: (current: FightState) => FightState,
): FightState {
  const result = run(state)
  if (state.forecastSimulation) return result
  const outcome = commandOutcome(state, result, intent.side)
  const feedback: CommandFeedback = {
    frame: state.frame,
    sequence: (state.commandFeedback?.[intent.side]?.sequence ?? 0) + 1,
    outcome,
    ...(outcome === 'refused' ? { reason: commandFailure(state, intent) } : {}),
  }
  return { ...result, commandFeedback: { ...result.commandFeedback, [intent.side]: feedback } }
}

function commandOutcome(before: FightState, after: FightState, side: FightSide) {
  const entry = after.training?.history.at(-1)
  if (
    entry &&
    entry.id >= (before.training?.nextHistoryId ?? Infinity) &&
    entry.outcome !== 'input'
  )
    return entry.outcome
  if (before === after) return 'refused'
  const buffered = after[side].bufferedAttack
  return buffered && buffered !== before[side].bufferedAttack ? 'buffered' : 'started'
}

export function visibleCommandFeedback(state: FightState, side: FightSide) {
  const feedback = state.commandFeedback?.[side]
  return feedback && state.frame - feedback.frame < 150 ? feedback : null
}

import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'
import type { TrainingAction, TrainingHistoryEntry } from './trainingTypes'

const HISTORY_LIMIT = 60

export function appendTrainingHistory(
  state: FightState,
  entry: Omit<TrainingHistoryEntry, 'id'>,
): FightState {
  const lab = state.training
  if (!lab || state.mode !== 'training' || state.forecastSimulation) return state
  return {
    ...state,
    training: {
      ...lab,
      nextHistoryId: lab.nextHistoryId + 1,
      history: [...lab.history, { ...entry, id: lab.nextHistoryId }].slice(-HISTORY_LIMIT),
    },
  }
}

export function sampleTrainingInputs(
  state: FightState,
  inputs: Record<FightSide, FightInput>,
): FightState {
  if (!state.training) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) next = sampleSide(next, side, inputs[side])
  return next
}

function sampleSide(state: FightState, side: FightSide, input: FightInput): FightState {
  const lab = state.training!
  const label =
    Object.keys(input)
      .filter((key) => input[key as keyof FightInput])
      .sort()
      .join(' + ') || 'neutral'
  if (lab.lastInputs[side] === label) {
    const last = [...lab.history]
      .reverse()
      .find((entry) => entry.side === side && entry.outcome === 'input')
    const history = lab.history.map((entry) =>
      entry === last ? { ...entry, duration: entry.duration + 1 } : entry,
    )
    return { ...state, training: { ...lab, history } }
  }
  const next = appendTrainingHistory(state, {
    side,
    frame: state.frame,
    label,
    outcome: 'input',
    duration: 1,
  })
  return {
    ...next,
    training: { ...next.training!, lastInputs: { ...lab.lastInputs, [side]: label } },
  }
}

export function observeTrainingCommand(
  state: FightState,
  command: { side: FightSide; action: TrainingAction; input?: FightInput },
  run: (current: FightState) => FightState,
): FightState {
  const lab = state.training
  if (!lab || lab.observing || state.forecastSimulation) return run(state)
  const observed = { ...state, training: { ...lab, observing: true } }
  const result = run(observed)
  const fighter = result[command.side]
  const outcome =
    result === observed
      ? 'refused'
      : fighter.bufferedAttack !== state[command.side].bufferedAttack && fighter.bufferedAttack
        ? 'buffered'
        : 'started'
  let next: FightState = { ...result, training: { ...result.training!, observing: false } }
  const recording = next.training!.recording
  if (recording.recording && command.side === 'opponent')
    next = {
      ...next,
      training: {
        ...next.training!,
        recording: {
          ...recording,
          commands: [
            ...recording.commands,
            {
              frame: state.frame - recording.start,
              action: command.action,
              input: { ...EMPTY_INPUT, ...command.input },
            },
          ].slice(-3600),
        },
      },
    }
  return appendTrainingHistory(next, {
    side: command.side,
    frame: state.frame,
    label: command.action,
    outcome,
    duration: 1,
  })
}

import { EMPTY_INPUT, type FightInput, type FightState } from './types'
import type { TrainingRecording } from './trainingTypes'

const MAX_RECORDING_FRAMES = 3600

export function toggleTrainingRecording(state: FightState): FightState {
  if (!state.training || state.mode !== 'training') return state
  const old = state.training.recording
  const recording: TrainingRecording = old.recording
    ? { ...old, recording: false, duration: Math.max(1, state.frame - old.start) }
    : {
        ...old,
        recording: true,
        playing: false,
        start: state.frame,
        duration: 0,
        index: 0,
        inputs: [],
        commands: [],
      }
  return { ...state, training: { ...state.training, recording } }
}

export function playTrainingRecording(state: FightState): FightState {
  if (!state.training || state.mode !== 'training') return state
  const old = state.training.recording
  if (old.duration === 0) return state
  return {
    ...state,
    training: {
      ...state.training,
      recording: {
        ...old,
        recording: false,
        playing: true,
        start: state.frame,
        index: 0,
      },
    },
  }
}

export function captureTrainingInput(state: FightState, input: FightInput): FightState {
  const lab = state.training
  if (!lab?.recording.recording) return state
  const old = lab.recording
  const frame = state.frame - old.start
  if (frame >= MAX_RECORDING_FRAMES) return toggleTrainingRecording(state)
  const previous = old.inputs[old.inputs.length - 1]?.input
  const changed = JSON.stringify(previous) !== JSON.stringify(input)
  return {
    ...state,
    training: {
      ...lab,
      recording: {
        ...old,
        duration: frame + 1,
        inputs: changed ? [...old.inputs, { frame, input: { ...input } }] : old.inputs,
      },
    },
  }
}

export function recordedTrainingInput(state: FightState): FightInput {
  const track = state.training!.recording
  const elapsed = state.frame - track.start
  const frame = track.loop ? elapsed % track.duration : elapsed
  if (frame >= track.duration) return { ...EMPTY_INPUT }
  const entry = [...track.inputs].reverse().find((entry) => entry.frame <= frame)
  return entry ? { ...entry.input } : { ...EMPTY_INPUT }
}

export function setTrainingLoop(state: FightState, loop: boolean): FightState {
  if (!state.training) return state
  return {
    ...state,
    training: { ...state.training, recording: { ...state.training.recording, loop } },
  }
}

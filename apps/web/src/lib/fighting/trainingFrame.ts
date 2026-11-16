import type { FutureControls } from './parallelFutureTypes'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'
import { enforceTrainingResources } from './trainingSession'
import { captureTrainingInput, recordedTrainingInput } from './trainingRecording'
import { measureTrainingRecovery, trainingCanAct } from './trainingMeasurement'
import { sampleTrainingInputs } from './trainingHistory'
import type { TrainingAction } from './trainingTypes'

interface TrainingFrameHooks {
  simulate: (state: FightState, controls: FutureControls) => FightState
  attack: (state: FightState, action: TrainingAction, input: FightInput) => FightState
}

/** Runs once per fixed simulation frame, never once per browser animation frame. */
export function stepTrainingFrame(
  state: FightState,
  controls: FutureControls,
  hooks: TrainingFrameHooks,
): FightState {
  if (!state.training || state.mode !== 'training' || state.forecastSimulation)
    return hooks.simulate(state, controls)
  let prepared = enforceTrainingResources(state)
  const opponent = dummyInput(prepared, controls.opponent ?? EMPTY_INPUT)
  prepared = captureTrainingInput(prepared, opponent)
  prepared = sampleTrainingInputs(prepared, { player: controls.player, opponent })
  prepared = playCommands(prepared, hooks)
  prepared = dummyAttack(prepared, hooks, opponent)
  const after = hooks.simulate(prepared, { player: controls.player, opponent, ai: false })
  return enforceTrainingResources(measureTrainingRecovery(prepared, after))
}

function dummyInput(state: FightState, manual: FightInput): FightInput {
  const lab = state.training!
  if (lab.recording.playing) return recordedTrainingInput(state)
  if (lab.recording.recording || lab.settings.dummy.behavior === 'manual') return manual
  const behavior = lab.settings.dummy.behavior
  return {
    ...EMPTY_INPUT,
    guard: ['guard', 'crouch-guard', 'reversal'].includes(behavior),
    down: behavior === 'crouch-guard',
    jump: behavior === 'jump',
  }
}

function dummyAttack(state: FightState, hooks: TrainingFrameHooks, input: FightInput): FightState {
  const lab = state.training!
  if (dummySuspended(state)) return state
  const { behavior, action, delay } = lab.settings.dummy
  const armed = lab.reversalArmed || dummyRecovering(state)
  const ready = trainingCanAct(state.opponent)
  const readyFrames = ready ? lab.readyFrames + 1 : 0
  const wantsAttack = behavior === 'attack' || (behavior === 'reversal' && armed)
  const prepared = { ...state, training: { ...lab, reversalArmed: armed, readyFrames } }
  if (!wantsAttack || !ready || readyFrames <= delay) return prepared
  const result = hooks.attack(prepared, action, { ...input, guard: false })
  return { ...result, training: { ...result.training!, reversalArmed: false, readyFrames: 0 } }
}

function dummySuspended(state: FightState): boolean {
  const recording = state.training!.recording
  return recording.recording || recording.playing || state.hitstop > 0
}

function dummyRecovering(state: FightState): boolean {
  const fighter = state.opponent
  return fighter.hitStun > 0 || fighter.blockStun > 0 || fighter.knockdownFrames > 0
}

function playCommands(state: FightState, hooks: TrainingFrameHooks): FightState {
  const lab = state.training!
  const track = lab.recording
  if (!track.playing) return state
  const elapsed = state.frame - track.start
  const cycle = Math.floor(elapsed / track.duration)
  const frame = elapsed % track.duration
  if (!track.loop && cycle > 0)
    return { ...state, training: { ...lab, recording: { ...track, playing: false } } }
  const start = cycle * track.commands.length
  let index = Math.max(track.index, start)
  let next = state
  while (index - start < track.commands.length && track.commands[index - start].frame <= frame) {
    const command = track.commands[index++ - start]
    next = hooks.attack(next, command.action, command.input)
  }
  return {
    ...next,
    training: { ...next.training!, recording: { ...next.training!.recording, index } },
  }
}

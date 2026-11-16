import type { FightInput, FightSide, MoveAction } from './types'

export type TrainingAction = MoveAction | 'ranged'
export type TrainingPosition = 'center' | 'left' | 'right'
export type DummyBehavior =
  'manual' | 'idle' | 'guard' | 'crouch-guard' | 'jump' | 'attack' | 'reversal'
export interface TrainingResources {
  health: number
  aura: number
  infiniteHealth: boolean
  infiniteAura: boolean
}
export interface TrainingSettings {
  resources: Record<FightSide, TrainingResources>
  dummy: { behavior: DummyBehavior; action: TrainingAction; delay: number }
}
export interface TrainingHistoryEntry {
  id: number
  frame: number
  side: FightSide
  label: string
  outcome: 'input' | 'started' | 'buffered' | 'refused'
  duration: number
}
export interface TrainingMeasurement {
  sequence: number
  attacker: FightSide
  contactFrame: number
  blocked: boolean
  ready: Partial<Record<FightSide, number>>
  status: 'pending' | 'complete' | 'interrupted'
  advantage?: number
}
export interface RecordedTrainingCommand {
  frame: number
  action: TrainingAction
  input: FightInput
}
export interface TrainingRecording {
  recording: boolean
  playing: boolean
  loop: boolean
  start: number
  duration: number
  index: number
  commands: readonly RecordedTrainingCommand[]
  inputs: readonly { frame: number; input: FightInput }[]
}
export interface TrainingState {
  settings: TrainingSettings
  history: readonly TrainingHistoryEntry[]
  nextHistoryId: number
  lastInputs: Partial<Record<FightSide, string>>
  measurement?: TrainingMeasurement
  observing?: boolean
  reversalArmed: boolean
  readyFrames: number
  recording: TrainingRecording
}

export function createTrainingState(health: number): TrainingState {
  const resources = { health, aura: 55, infiniteHealth: false, infiniteAura: false }
  return {
    settings: {
      resources: { player: { ...resources }, opponent: { ...resources } },
      dummy: { behavior: 'manual', action: 'light', delay: 0 },
    },
    history: [],
    nextHistoryId: 1,
    lastInputs: {},
    reversalArmed: false,
    readyFrames: 0,
    recording: {
      recording: false,
      playing: false,
      loop: false,
      start: 0,
      duration: 0,
      index: 0,
      commands: [],
      inputs: [],
    },
  }
}

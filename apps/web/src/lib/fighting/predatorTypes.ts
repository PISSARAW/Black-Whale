import type { PredatorSheet } from './predatorSheet'
import type { FightSide } from './types'

export type PredatorPreyId =
  | 'bungee-gum'
  | 'hanzo-skill-4'
  | 'rising-sun'
  | 'blinky'
  | 'black-voice'
  | 'sun-and-moon'
  | 'chain-jail'
  | 'steal-chain'
  | 'nen-stitches'
  | 'needle-control'
  | 'bloody-mary'
  | 'paper-serpent'

export interface PredatorAnalysis {
  owner: FightSide
  preyId: PredatorPreyId
  /** Behaviour line of the sheet: frames of personal sight of this manifestation. */
  observedFrames: number
  /** Trigger, target, range and conditions, each from Rihan's own observation. */
  sheet: PredatorSheet
}

export interface PredatorHunt {
  owner: FightSide
  preyId: PredatorPreyId
  x: number
  y: number
  age: number
}

export interface PredatorState {
  watching: boolean
  known: readonly PredatorPreyId[]
  analysis: PredatorAnalysis | null
  hunt: PredatorHunt | null
  sealFrames: number
  successes: number
  /** Live prey already accounted for: active when the watch began, or already studied. */
  liveBefore?: readonly PredatorPreyId[]
}

export function createPredatorState(): PredatorState {
  return { watching: false, known: [], analysis: null, hunt: null, sealFrames: 0, successes: 0 }
}

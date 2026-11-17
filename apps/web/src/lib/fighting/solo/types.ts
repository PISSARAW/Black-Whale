import type { FighterId, FightState } from '../types'
import type { FightStageId } from '../stages'
export type SoloMode = 'story' | 'survival' | 'time-attack' | 'score-attack'
export type SoloRouteId = 'reading' | 'escort' | 'duelist'
export type SoloGoal =
  'reveal' | 'interrupt' | 'question' | 'protect-crate' | 'protect-body' | 'survive' | 'win-round'
export interface SoloEncounter {
  id: string
  player: FighterId | 'selected'
  opponent: FighterId
  stage: FightStageId
  goal: SoloGoal
  script: 'idle' | 'fire' | 'ai'
  limit: number
  duration?: number
  title: readonly [string, string]
  instruction: readonly [string, string]
  premises: readonly [string, string]
}
export interface SoloRoute {
  id: SoloRouteId
  title: readonly [string, string]
  encounters: readonly string[]
  ending: readonly [string, string]
  reward: readonly [string, string]
}
export interface SoloObjective {
  start: number
  lastFrame: number
  lastImpact: number
  held: number
  contact: boolean
  threat: boolean
}
export type SoloStatus = 'briefing' | 'playing' | 'won' | 'failed' | 'complete'
export interface SoloResult {
  encounter: string
  frames: number
  score: number
}
export interface SoloRun {
  id: string
  mode: SoloMode
  route: SoloRouteId
  fighter: FighterId
  seed: number
  index: number
  status: SoloStatus
  elapsed: number
  score: number
  results: SoloResult[]
  objective: SoloObjective
  failure: 'defeat' | 'timeout' | 'object-lost' | 'objective' | 'invalid' | null
  carry?: string
}
export interface SoloSave {
  version: 1
  ruleset: string
  run: SoloRun | null
  routes: SoloRouteId[]
  records: Partial<
    Record<
      Exclude<SoloMode, 'story'>,
      { wins: number; frames: number; score: number; cleared: boolean }
    >
  >
}
export interface SoloSession {
  run: SoloRun
  state: FightState
  encounter: SoloEncounter
}
declare module '../types' {
  interface FightState {
    soloSession?: { run: string; encounter: string }
  }
}

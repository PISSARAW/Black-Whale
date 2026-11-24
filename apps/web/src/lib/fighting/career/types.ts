import type { FightMode, FightSide, FighterId } from '../types'
import type { FightFormatId } from '../formats'
import type { FightStageId } from '../stages'
import type { ObservedCondition } from '../perception/opponentIntel'

export interface CareerMatchIntel {
  auraObserved: boolean
  kameoRevealed: boolean
  revealedConditions: readonly ObservedCondition[]
}
export type OpponentKnowledgeFact = 'aura' | 'kameo' | `condition:${ObservedCondition}`
export interface OpponentKnowledgeEntry {
  fact: OpponentKnowledgeFact
  observations: number
  confidence: 'suspected' | 'confirmed' | 'established'
  lastMatchId: string
  lastSeenAt: number
}
export interface OpponentKnowledge {
  opponent: FighterId
  entries: readonly OpponentKnowledgeEntry[]
}
export type RematchVowKind = 'no-retreat' | 'open-hatsu' | 'single-hatsu'
export interface PendingRematchVow {
  kind: RematchVowKind
  opponent: FighterId
  sourceMatchId: string
}

export interface FighterPractice {
  bestCombo: number
  bestComboDamage: number
  healthLost: number
}
export interface MatchPractice {
  frames: number
  player: FighterPractice
  opponent: FighterPractice
}
export interface CareerMatch {
  id: string
  at: number
  source: Exclude<FightMode, 'training'> | 'pvp'
  player: FighterId
  opponent: FighterId
  stage: FightStageId
  format: FightFormatId
  winner: FightSide
  rounds: Record<FightSide, number>
  practice: MatchPractice
  ruleset: string
  /** Only information the player actually observed; never grants a combat modifier. */
  intel?: CareerMatchIntel
}
export interface CareerAppearance {
  theme: 'whale' | 'heavens' | 'nocturne'
  intro: 'full' | 'brief' | 'off'
  victory: 'salute' | 'ready' | 'still'
}
export interface CareerProfile {
  version: 1
  name: string
  appearance: CareerAppearance
  history: CareerMatch[]
  totals: Partial<Record<FighterId, FighterTotals>>
  seen: string[]
  moraleSeen: string[]
  opponentKnowledge: Partial<Record<FighterId, OpponentKnowledge>>
  rematchVows: Partial<Record<FighterId, PendingRematchVow>>
  revision: number
}
export interface FighterTotals {
  matches: number
  wins: number
  points: number
  frames: number
  bestCombo: number
  bestComboDamage: number
}
export const defaultAppearance = (): CareerAppearance => ({
  theme: 'whale',
  intro: 'full',
  victory: 'salute',
})
export const emptyCareer = (): CareerProfile => ({
  version: 1,
  name: 'Hunter',
  appearance: defaultAppearance(),
  history: [],
  totals: {},
  seen: [],
  moraleSeen: [],
  opponentKnowledge: {},
  rematchVows: {},
  revision: 0,
})
export const CAREER_STORAGE = 'black-whale:clash:career:1'

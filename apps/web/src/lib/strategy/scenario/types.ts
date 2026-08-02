import type { StrategyDoctrine } from '../rules'

export type StrategyDifficulty = 'STORY' | 'NORMAL' | 'EXPERT'
export type StrategyObjectiveKind = 'OCCUPY_DISTINCT' | 'CONFIRM_HOSTILES' | 'FORM_BASTION'
export type StrategyFailureKind = 'TURN_LIMIT' | 'FACTION_ELIMINATED'
export type StrategyScenarioEventKind = 'ALERT' | 'BLACKOUT' | 'LOCKDOWN'

export interface StrategyScenarioObjective {
  id: string
  kind: StrategyObjectiveKind
  title: string
  description: string
  target: number
  secret: boolean
}

export interface StrategyScenarioFaction {
  factionId: string
  doctrine: StrategyDoctrine
  requiredCharacterIds: string[]
  publicObjective: StrategyScenarioObjective
  secretObjective: StrategyScenarioObjective
}

export interface StrategyScenarioEventV2 {
  id: string
  turn: number
  kind: StrategyScenarioEventKind
  title: string
  description: string
  aiMoveMultiplier: number
}

export interface StrategyProvenance {
  sourceId: string
  chapter: number
  note: string
}

export interface StrategyScenarioV2 {
  schemaVersion: 2
  id: string
  contentVersion: number
  title: string
  description: string
  chapterNumber: number
  maxTurns: number
  defaultDifficulty: StrategyDifficulty
  playableFactions: StrategyScenarioFaction[]
  locationIds: string[]
  events: StrategyScenarioEventV2[]
  failureConditions: StrategyFailureKind[]
  provenance: StrategyProvenance[]
}

export interface StrategyScenarioValidationContext {
  factionIds: ReadonlySet<string>
  characterIds: ReadonlySet<string>
  locationIds: ReadonlySet<string>
  sourceIds?: ReadonlySet<string>
}

export interface StrategyScenarioValidationIssue {
  path: string
  message: string
}

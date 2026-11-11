import type { FactionRelationship } from '../diplomacy'
import type { UnitCondition } from '../conflict'

export type StrategyReputation = 'RELIABLE' | 'PRAGMATIC' | 'TREACHEROUS'
export type StrategyThreadKind = 'SUCCESSION' | 'MAFIA' | 'GUARDIAN_NEN'
export type StrategyThreadStage = 'DORMANT' | 'MANEUVERING' | 'ESCALATING' | 'CRISIS' | 'RESOLVED'

export interface StrategyAutonomousThread {
  id: string
  kind: StrategyThreadKind
  actorId: string
  pressure: number
  stage: StrategyThreadStage
  lastScenarioId: string | null
}

export interface StrategyCampaignOutcome {
  scenarioId: string
  selectedFactionId: string
  won: boolean
  turnsPlayed: number
  victoryPoints: number
  relationships: Record<string, FactionRelationship>
  unitConditions: Record<string, UnitCondition>
}

export interface StrategyCampaignV3 {
  version: 3
  id: string
  seed: string
  currentScenarioIndex: number
  scenarioIds: string[]
  outcomes: StrategyCampaignOutcome[]
  relationships: Record<string, FactionRelationship>
  unitConditions: Record<string, UnitCondition>
  reputation: StrategyReputation
  chronicle: string[]
  /** Optional so checksummed V3 saves created before autonomous threads remain readable. */
  autonomousThreads?: StrategyAutonomousThread[]
  completed: boolean
}

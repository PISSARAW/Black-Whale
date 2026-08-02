import type { FactionRelationship } from '../diplomacy'
import type { UnitCondition } from '../conflict'

export type StrategyReputation = 'RELIABLE' | 'PRAGMATIC' | 'TREACHEROUS'

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
  completed: boolean
}

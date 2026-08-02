import type { StrategyOrder } from './rules'

export interface StrategyMember {
  character: { id: string; canonicalName: string }
  role: string
}

export interface StrategyFaction {
  id: string
  name: string
  members: StrategyMember[]
}

export interface StrategyLocation {
  id: string
  name: string
  type: 'SHIP' | 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'
}

export type StrategyMoveOrder = StrategyOrder

export interface StrategyIntel {
  entityId: string
  locationId: string
  observedTurn: number
  certainty: 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'
}

export interface StrategyTurnResult {
  playerEvents: number
  aiEvents: number
  totalEvents: number
  warnings: string[]
}

import type { DiplomacyOrder } from '../diplomacy'
import type { StrategyMoveOrder } from '../types'

export interface StrategyTurnV2 {
  turn: number
  orders: StrategyMoveOrder[]
  diplomacy: DiplomacyOrder[]
}

export interface StrategyReplayV2 {
  version: 2
  scenarioId: string
  scenarioContentVersion: number
  seed: string
  baseEventId: string
  selectedFactionId: string
  turns: StrategyTurnV2[]
}

export interface StrategySaveV2 extends StrategyReplayV2 {
  savedAt: string
  checksum: string
}

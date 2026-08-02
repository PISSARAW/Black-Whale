import type { DiplomacyOrder } from './diplomacy'
import type { StrategyMoveOrder } from './types'

export const STRATEGY_SAVE_KEY = 'black-whale:strategy:save:v1'

export interface StrategySave {
  version: 1
  savedAt: string
  baseEventId: string
  selectedFactionId: string
  turns: Array<{ orders: StrategyMoveOrder[]; diplomacy: DiplomacyOrder[] }>
}

export function encodeStrategySave(save: StrategySave): string {
  return JSON.stringify(save)
}

export function decodeStrategySave(serialized: string | null): StrategySave | null {
  if (!serialized) return null
  try {
    const parsed = JSON.parse(serialized) as Partial<StrategySave>
    if (
      parsed.version !== 1 ||
      !parsed.baseEventId ||
      !parsed.selectedFactionId ||
      !Array.isArray(parsed.turns)
    )
      return null
    return parsed as StrategySave
  } catch {
    return null
  }
}

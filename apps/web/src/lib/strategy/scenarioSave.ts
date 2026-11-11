import type { DiplomacyOrder } from './diplomacy'
import { createStrategySave, type StrategySave } from './persistence'
import type { StrategyScenarioV2 } from './scenario/types'
import type { StrategyMoveOrder } from './types'

/**
 * The save the page writes after each turn: the scenario's replay, rebuilt
 * from the orders played so far. Taken out of the route's `handleEndTurn`.
 *
 * `turnHistory` must be plain data — pass `$state.snapshot(...)` from a
 * component, since a reactive proxy cannot be serialised by structuredClone.
 */
export interface ScenarioSaveInput {
  savedAt: string
  cutoffEventId?: string
  factionId: string
  turnHistory: ReadonlyArray<{ orders: StrategyMoveOrder[]; diplomacy: DiplomacyOrder[] }>
  scenario?: StrategyScenarioV2
}

export function scenarioSaveFor(input: ScenarioSaveInput): StrategySave {
  return createStrategySave(
    {
      savedAt: input.savedAt,
      seed: `${input.cutoffEventId ?? 'unknown'}:${input.factionId}`,
      baseEventId: input.cutoffEventId ?? '',
      selectedFactionId: input.factionId,
      turns: input.turnHistory.map((turn, index) => ({ ...turn, turn: index + 1 })),
    },
    input.scenario,
  )
}

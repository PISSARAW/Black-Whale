import { GUARDS_359_SCENARIO } from './guards359'
import { LOCKDOWN_SCENARIO } from './lockdown'
import { MAFIA_WAR_SCENARIO } from './mafia'
import type { StrategyScenarioV2 } from './types'

export const DEFAULT_STRATEGY_SCENARIO_ID = GUARDS_359_SCENARIO.id

const SCENARIOS = new Map<string, StrategyScenarioV2>([
  [GUARDS_359_SCENARIO.id, GUARDS_359_SCENARIO],
  [MAFIA_WAR_SCENARIO.id, MAFIA_WAR_SCENARIO],
  [LOCKDOWN_SCENARIO.id, LOCKDOWN_SCENARIO],
])

export function strategyScenarioById(id: string): StrategyScenarioV2 | null {
  return SCENARIOS.get(id) ?? null
}

export function requireStrategyScenario(id = DEFAULT_STRATEGY_SCENARIO_ID): StrategyScenarioV2 {
  const scenario = strategyScenarioById(id)
  if (!scenario) throw new Error(`Unknown Strategy scenario: ${id}`)
  return scenario
}

export function listStrategyScenarios(): StrategyScenarioV2[] {
  return [...SCENARIOS.values()]
}

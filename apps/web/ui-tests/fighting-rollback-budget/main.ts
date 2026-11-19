import { budgetScenarios } from './scenarios'
import { measureScenario, type SnapshotMode } from './measure'

/** Driven by scripts/check-fighting-rollback.mjs; one call per mode and CPU profile. */
function rollbackBudget(modes: SnapshotMode[], only?: string[]) {
  const scenarios = budgetScenarios().filter((entry) => !only || only.includes(entry.id))
  return scenarios.flatMap((scenario) => modes.map((mode) => measureScenario(scenario, { mode })))
}
Object.assign(window, { rollbackBudget })

import type { CombatRouteSetup } from './combatRouteSetup'
import type { FightPreparation, PreparationResource } from './preparationTypes'

const RESOURCES: Partial<Record<CombatRouteSetup, PreparationResource>> = {
  growth: 'plants',
  courier: 'birds',
  'little-eye': 'animals',
  anchor: 'rooms',
}

/** Install ordinary scenario premises, never already grown, controlled or anchored entities. */
export function combatRouteScenario(setup?: CombatRouteSetup): FightPreparation | undefined {
  const resource = setup && RESOURCES[setup]
  return resource ? { mode: 'scenario', resources: [resource], cohorts: [] } : undefined
}

import { physicalNenBody } from './physicalNenBody'
import { categoryProximity, type ActiveNenCategory } from '@black-whale/nen-engine'
import { FIGHT_NEN_PROFILES, FIGHT_ABILITY_CATEGORIES } from './nenCatalogue.gen'
import type { ArcadeFighter } from './types'

export const FIGHT_CATEGORIES: readonly ActiveNenCategory[] = [
  'enhancer',
  'emitter',
  'conjurer',
  'transmuter',
  'manipulator',
  'specialist',
]

/** Efficiency of an already learned action, not the level of technique it can learn.
 * Unknown affinities and specialists' ordinary categories use neutral arcade tuning;
 * we never infer an innate type from the type of an ability (e.g. Hanzo).
 */
export function fightCategoryEfficiency(
  fighter: ArcadeFighter,
  category: ActiveNenCategory,
): number {
  if (physicalNenBody(fighter).nen.mode === 'zetsu') return 0
  const owner = fighter.nenOwner ?? fighter.id
  if (owner === 'kurapika' && ownEmperorTime(fighter)) return 1
  const affinity = FIGHT_NEN_PROFILES[owner]?.affinity ?? 'unknown'
  return affinityEfficiency(affinity, category)
}

function ownEmperorTime(fighter: ArcadeFighter): boolean {
  return fighter.dolphinLoanChannel?.emperorTime ?? fighter.kurapika?.emperorTime ?? false
}

function affinityEfficiency(affinity: string, category: ActiveNenCategory): number {
  if (affinity === 'unknown') return category === 'specialist' ? 0 : 0.7
  if (category === 'specialist') return affinity === 'specialist' ? 1 : 0
  if (affinity === 'specialist') return 0.7
  return categoryProximity(affinity as ActiveNenCategory, category)
}

export function abilityCategories(ability: string | null): readonly ActiveNenCategory[] {
  return ability ? (FIGHT_ABILITY_CATEGORIES[ability] ?? []) : []
}

/** Each component is calculated separately: there is no stacking six global buffs. */
export function categoryPower(fighter: ArcadeFighter, category: ActiveNenCategory): number {
  return 0.7 + 0.5 * abilityCategoryEfficiency(fighter, category)
}

export function constructionFactor(fighter: ArcadeFighter): number {
  return categoryPower(fighter, 'conjurer')
}

export function manipulationFactor(fighter: ArcadeFighter): number {
  return categoryPower(fighter, 'manipulator')
}

/** An ability loan uses the donor's stolen aura, without lending the carrier Emperor Time. */
export function abilityCategoryEfficiency(
  fighter: ArcadeFighter,
  category: ActiveNenCategory,
): number {
  return (
    fighter.dolphinExecution?.supply.efficiencies[category] ??
    fightCategoryEfficiency(fighter, category)
  )
}

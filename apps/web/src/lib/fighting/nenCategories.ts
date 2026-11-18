import { categoryProximity, type ActiveNenCategory } from '@black-whale/nen-engine'
import { FIGHT_ABILITY_CATEGORIES } from './nenCatalogue.gen'
import type { ArcadeFighter } from './types'
import { nenMasteryProfile } from './nenMastery'

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
  if (fighter.nen.mode === 'zetsu') return 0
  const owner = fighter.nenOwner ?? fighter.id
  if (owner === 'kurapika' && fighter.kurapika?.emperorTime) return 1
  const affinity = nenMasteryProfile(owner).affinity
  return affinityEfficiency(affinity, category)
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
  return 0.5 + 0.7 * fightCategoryEfficiency(fighter, category)
}

export function constructionFactor(fighter: ArcadeFighter): number {
  return categoryPower(fighter, 'conjurer')
}

export function manipulationFactor(fighter: ArcadeFighter): number {
  return categoryPower(fighter, 'manipulator')
}

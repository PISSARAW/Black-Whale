import type { ActiveNenCategory } from '@black-whale/nen-engine'
import { FIGHT_NEN_PROFILES, FIGHT_ABILITY_CATEGORIES } from './nenCatalogue.gen'
import { NEN_CANON } from './nenCanon'
import type { ArcadeFighter, FighterId } from './types'

export type NenTrainingEvidence = 'duel-foundation' | 'catalogued-application' | 'unverified'
export interface NenTraining {
  /** Operational tiers for Clash, not a numbered rank attributed to Togashi. */
  level: 0 | 1 | 2
  evidence: NenTrainingEvidence
  abilities: readonly string[]
}
const CATEGORIES: readonly ActiveNenCategory[] = [
  'enhancer',
  'emitter',
  'transmuter',
  'conjurer',
  'manipulator',
  'specialist',
]

const PROFILES = new Map<FighterId, ReturnType<typeof buildNenMasteryProfile>>()

export function nenMasteryProfile(id: FighterId) {
  const held = PROFILES.get(id)
  if (held) return held
  const made = buildNenMasteryProfile(id)
  PROFILES.set(id, made)
  return made
}

/** Only executable, canon-qualified abilities supply learned applications. Affinity alone grants none. */
function buildNenMasteryProfile(id: FighterId) {
  const abilities = NEN_CANON[id]?.abilities ?? []
  const training = Object.fromEntries(
    CATEGORIES.map((category) => {
      const learned = abilities.filter((ability) =>
        FIGHT_ABILITY_CATEGORIES[ability]?.includes(category),
      )
      return [category, categoryTraining(category, learned)]
    }),
  ) as Record<ActiveNenCategory, NenTraining>
  return { affinity: FIGHT_NEN_PROFILES[id]?.affinity ?? 'unknown', abilities, training }
}

function categoryTraining(category: ActiveNenCategory, abilities: readonly string[]): NenTraining {
  if (abilities.length) return { level: 2, evidence: 'catalogued-application', abilities }
  if (category === 'enhancer') return { level: 1, evidence: 'duel-foundation', abilities }
  return { level: 0, evidence: 'unverified', abilities }
}

export function fighterNenTraining(fighter: ArcadeFighter, category: ActiveNenCategory) {
  return nenMasteryProfile(fighter.nenOwner ?? fighter.id).training[category]
}

export function learnedNenApplication(fighter: ArcadeFighter, ability: string): boolean {
  return nenMasteryProfile(fighter.nenOwner ?? fighter.id).abilities.includes(ability)
}

/** Learning admission and execution yield are separate; Emperor Time changes only the latter. */
export function meetsNenTraining(
  fighter: ArcadeFighter,
  requirement: { category: ActiveNenCategory; level: 1 | 2; ability?: string },
): boolean {
  const training = fighterNenTraining(fighter, requirement.category)
  if (training.level < requirement.level) return false
  return !requirement.ability || learnedNenApplication(fighter, requirement.ability)
}

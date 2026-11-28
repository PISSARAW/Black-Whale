import {
  FIGHT_NEN_PROFILES,
  FIGHT_ABILITY_CATEGORIES,
} from '../../src/lib/fighting/nenCatalogue.gen'
import { COMBAT_FIGHTERS } from '../../src/lib/fighting/combatRoutes'

/** Hexagon order: each category sits next to the ones it is closest to. */
export const HEXAGON = [
  'enhancer',
  'transmuter',
  'conjurer',
  'specialist',
  'manipulator',
  'emitter',
] as const
export type Category = (typeof HEXAGON)[number] | 'unknown'

/** Sections are titled by the technique shown, never by an innate type the canon withholds. */
export const TITLES: Record<Category, string> = {
  enhancer: 'Enhancement',
  transmuter: 'Transmutation',
  conjurer: 'Conjuration',
  specialist: 'Specialization',
  manipulator: 'Manipulation',
  emitter: 'Emission',
  unknown: '???',
}

/** The game's own aura colours (auraColours.ts). */
export const COLOURS: Record<Category, string> = {
  enhancer: '#3b82f6',
  transmuter: '#a855f7',
  conjurer: '#ef4444',
  specialist: '#f5f0ff',
  manipulator: '#22c55e',
  emitter: '#facc15',
  unknown: '#8a8a8a',
}

type Profiles = Record<string, { affinity: string; abilities: readonly string[] }>
type Abilities = Record<string, readonly string[]>

/**
 * A known affinity wins. Otherwise the fighter's abilities must all point to one category;
 * no category or several (Halkenburg's Grimmel) stays unknown rather than guessed.
 */
export function categoryOf(id: string): Category {
  const profile = (FIGHT_NEN_PROFILES as Profiles)[id]
  if (!profile) return 'unknown'
  if ((HEXAGON as readonly string[]).includes(profile.affinity)) return profile.affinity as Category
  const found = new Set(
    profile.abilities.flatMap((a) => (FIGHT_ABILITY_CATEGORIES as Abilities)[a] ?? []),
  )
  return found.size === 1 ? ([...found][0] as Category) : 'unknown'
}

/** Conjuration ends on Kurapika: Emperor Time carries him into Specialization. */
export const PIVOT = 'kurapika'

export function groups(): { category: Category; fighters: string[] }[] {
  const order: Category[] = [...HEXAGON, 'unknown']
  return order.map((category) => {
    const fighters = COMBAT_FIGHTERS.filter((id) => categoryOf(id) === category)
    const sorted = fighters.filter((id) => id !== PIVOT)
    if (fighters.includes(PIVOT)) sorted.push(PIVOT)
    return { category, fighters: sorted }
  })
}

import type { Character } from '@black-whale/contracts'

/**
 * What the catalogue says about a character, read the way the map needs it.
 *
 * Every function here is a decision the projection makes — is this body dead,
 * how firmly may the map assert its position, when does it leave the deck — and
 * none of them touches the database. That is the whole point of the split: the
 * decisions are the part that was never testable while they lived inside a
 * 1,042-line script wrapped around a Prisma client.
 */

/** French and English, because the catalogue was authored in both. */
const DEAD_STATUS = /^(mort|morte|decede|decedee|décédé|décédée|dead|deceased)$/i

export function isDeadStatus(status: string | null | undefined): boolean {
  return DEAD_STATUS.test(status ?? '')
}

/**
 * Statuses that put the character's body on panel.
 *
 * `pictured`, `mentioned`, `flashback`, `vision`, `voice` and `impersonated`
 * all describe someone discussed or shown in effigy while being somewhere else
 * — or nowhere. `corpse` is deliberately absent: a dead body leaves the map.
 */
export const PRESENT_STATUSES: ReadonlySet<string> = new Set([
  'appears',
  'debut',
  'disguised',
  'death',
])

/**
 * The chapter a character dies in, or null if they never stop appearing.
 *
 * A `death` entry only counts when the character is not present again later:
 * Hisoka "dies" in 356 and is back on panel in 357, so he never leaves the map.
 */
export function deathChapter(character: Character): number | null {
  const appearances = character.mangaAppearances ?? []
  const death = [...appearances].reverse().find((entry) => entry.status === 'death')
  if (!death) return null
  const returnsLater = appearances.some(
    (entry) => entry.chapter > death.chapter && PRESENT_STATUSES.has(entry.status),
  )
  return returnsLater ? null : death.chapter
}

export type Certainty = 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'

/**
 * How firmly the map may assert a position.
 *
 * `positionProvenance: 'databook'` marks a post known only from Togashi's
 * character sheets: the room is stated, the chapter never is. `'inferred'` is
 * weaker still — canon places the passenger on a tier and never names their
 * room, so the catalogue picks the one their affiliation implies. Both are
 * better than leaving someone adrift on a deck, and both are deductions the
 * map has to draw as such.
 */
export function certaintyFor(character: Character): Certainty {
  if (character.positionProvenance) return 'PROBABLE'
  return /^(inconnu|suspect)$/i.test(character.shipLocation?.status ?? '')
    ? 'PROBABLE'
    : 'CONFIRMED'
}

export type NarrativeImportance = 'PRIMARY' | 'SECONDARY' | 'MINOR'

export function narrativeImportance(canonStatus: string | undefined): NarrativeImportance {
  if (canonStatus === 'canon') return 'PRIMARY'
  if (canonStatus === 'semi-canon') return 'SECONDARY'
  return 'MINOR'
}

/** How much detail the 3D tour models a passenger with; Tier 1 gets the most. */
export function modelingLevel(tier: number | null | undefined): number {
  if (tier === 1) return 1
  if (tier === 2) return 2
  return tier ? 3 : 4
}

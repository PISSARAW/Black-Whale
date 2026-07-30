import { visibleLineage, type BeyondLineageStatus } from '$lib/beyondLineage'
import type { CatalogCharacter } from '$lib/server/data-files'

/**
 * The faction chips offered by the ship map filter. These are reader-facing
 * groupings, not canonical factions: "princes" means the heirs themselves, not
 * everyone in their camp.
 */
export type FactionFilterId = 'princes' | 'guards' | 'hunters' | 'spider' | 'mafia'

/** What the resolver needs from a character row; the rest of it is irrelevant. */
export interface FactionSubject {
  canonicalName: string
  slug?: string | null
  description?: string | null
}

export interface AbilityCatalogEntry {
  id: string
  ownerId?: string | null
  name: string
}

/** A catalogued Hatsu reduced to what the map markers carry. */
export interface HatsuReference {
  id: string
  name: string
}

/** Index the canon catalogue by display name, the only key both sides share. */
export function buildCatalogIndex(catalog: CatalogCharacter[]): Map<string, CatalogCharacter> {
  return new Map(catalog.map((character) => [character.canonicalName, character]))
}

/** Index Hatsu by their owner's catalogue id. */
export function buildHatsuIndex(abilities: AbilityCatalogEntry[]): Map<string, HatsuReference[]> {
  const byOwner = new Map<string, HatsuReference[]>()
  for (const ability of abilities) {
    if (!ability.ownerId) continue
    const owned = byOwner.get(ability.ownerId) ?? []
    owned.push({ id: ability.id, name: ability.name })
    byOwner.set(ability.ownerId, owned)
  }
  return byOwner
}

/** The filter chips implied by an affiliation type recorded in the database. */
export function factionTagsForMembershipType(type: string): FactionFilterId[] {
  switch (type) {
    case 'KAKIN_ROYAL_ARMY':
    case 'BENJAMIN_PRIVATE_ARMY':
      return ['guards']
    case 'HUNTER_ASSOCIATION':
      return ['hunters']
    case 'PHANTOM_TROUPE':
      return ['spider']
    case 'MAFIA_FAMILY':
      return ['mafia']
    default:
      return []
  }
}

/** Strip accents and case so the French and English role text match one regex. */
function searchableText(parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const HUNTER_ROLE = /\b(hunter|zodiaque)\b/
const GUARD_ROLE = /\b(garde|guard|protecteur|soldat|soldier|securite)\b/

/**
 * Which filter chips a character belongs to at a given point in the story.
 *
 * Temporal `AffiliationMembership` rows are authoritative when they exist. The
 * imported canon catalogue — including a regex over the role text — remains a
 * fallback while that table is progressively populated, so a character with no
 * recorded membership still lands in a sensible chip.
 */
export function resolveFactionTags(
  subject: FactionSubject,
  activeFactionTypes: string[],
  catalogIndex: Map<string, CatalogCharacter>,
): FactionFilterId[] {
  const tags = new Set<FactionFilterId>()
  for (const type of activeFactionTypes) {
    for (const tag of factionTagsForMembershipType(type)) tags.add(tag)
  }

  const catalogued = catalogIndex.get(subject.canonicalName)
  const factionId = catalogued?.factionId || ''
  const roleText = searchableText([
    subject.slug,
    subject.description,
    catalogued?.description,
    catalogued?.shipLocation?.role,
  ])

  if (catalogued?.id.startsWith('prince-')) tags.add('princes')
  if (factionId === 'phantom-troupe') tags.add('spider')
  if (factionId.startsWith('mafia-')) tags.add('mafia')
  if (factionId === 'zodiacs' || HUNTER_ROLE.test(roleText)) tags.add('hunters')
  if (GUARD_ROLE.test(roleText)) tags.add('guards')

  return [...tags]
}

/**
 * Whether a character is one of Beyond's children, as far as this reader knows.
 *
 * Only the status travels to the map: a marker has room for a chip, not for the
 * evidence behind it, and the registry is where that argument belongs. The
 * spoiler cap is applied here rather than in the browser, so a capped reader
 * receives no lineage field at all — hiding the chip client-side would still
 * ship the answer in the page payload.
 */
export function beyondLineageStatusFor(
  subject: FactionSubject,
  catalogIndex: Map<string, CatalogCharacter>,
  spoilerLimit?: number,
): BeyondLineageStatus | undefined {
  const catalogued = catalogIndex.get(subject.canonicalName)
  return visibleLineage(catalogued?.beyondLineage, spoilerLimit)?.status
}

/** The Hatsu attributed to a character, resolved through the catalogue. */
export function hatsuFor(
  subject: FactionSubject,
  catalogIndex: Map<string, CatalogCharacter>,
  hatsuIndex: Map<string, HatsuReference[]>,
): HatsuReference[] {
  const ownerId = catalogIndex.get(subject.canonicalName)?.id ?? subject.slug
  return (ownerId ? hatsuIndex.get(ownerId) : undefined) ?? []
}

/**
 * The Hatsu ids attributed to a character. Ids — not display names — are what
 * the interaction layer resolves against, because catalogue names and registry
 * names diverge often enough that name matching picks the wrong technique.
 */
export function hatsuIdsFor(
  subject: FactionSubject,
  catalogIndex: Map<string, CatalogCharacter>,
  hatsuIndex: Map<string, HatsuReference[]>,
): string[] {
  return hatsuFor(subject, catalogIndex, hatsuIndex).map((hatsu) => hatsu.id)
}

/** The Hatsu names attributed to a character, for display. */
export function hatsuNamesFor(
  subject: FactionSubject,
  catalogIndex: Map<string, CatalogCharacter>,
  hatsuIndex: Map<string, HatsuReference[]>,
): string[] {
  return hatsuFor(subject, catalogIndex, hatsuIndex).map((hatsu) => hatsu.name)
}

import { eventDetail } from './character-timeline.js'

/**
 * Shaping the character page's view model.
 *
 * Two sources answer to different rules. The JSON catalogue is hand-written
 * and sparse, so every optional field is normalised here rather than in the
 * template — a missing `biography` must reach the page as `[]`, not as
 * `undefined` the markup has to guard. The database rows are complete but
 * temporal, and flatten to chapter numbers.
 */

export interface CharacterProfile {
  id: string
  slug: string
  canonicalName: string
  aliases: string[]
  identity: CharacterIdentity | null
  shipLocation: ShipLocation | null
  factionId: string | null
  firstVisibleChapter: number | null
  description: string | null
  biography: string[]
  abilitiesAndPowers: string | null
  equipment: EquipmentRecord[]
  nen: NenRecord | null
  mangaAppearances: MangaAppearance[]
  battles: NamedEncounter[]
  competitions: NamedEncounter[]
  abilities: AbilityRecord[]
}

export interface CharacterIdentity {
  status: string
  description: string
  counterpartId: string
  counterpartLabel: string
}

export interface ShipLocation {
  tier?: number
  room?: string
  status?: string
  role?: string | null
}

export interface EquipmentRecord {
  name: string
  description: string
}

export interface NenRecord {
  type: string
  typeLabel?: string
  secondaryTypeLabels?: string[]
  overview?: string
  combatProficiency?: string
  techniques?: string[]
}

export interface MangaAppearance {
  chapter: number
  status: string
  title?: string
}

export type NamedEncounter = string | { label?: string; name?: string }

export interface HistoryEntry {
  label: string
  chapter: number
  untilChapter: number | null
  detail: string | null
}

export interface AffiliationEntry {
  name: string
  role: string
  status: string
  chapter: number
  untilChapter: number | null
}

export interface CatalogCharacterRecord {
  id: string
  canonicalName?: string
  aliases?: string[]
  identity?: CharacterIdentity
  shipLocation?: ShipLocation
  factionId?: string | null
  description?: string | null
  biography?: string[]
  abilitiesAndPowers?: string
  equipment?: EquipmentRecord[]
  nen?: NenRecord
  mangaAppearances?: MangaAppearance[]
  battles?: NamedEncounter[]
  competitions?: NamedEncounter[]
  firstAppearanceChapterId?: string | null
}

export interface AbilityRecord {
  id: string
  ownerId?: string | null
  userIds?: string[]
  name?: string
  alternateNames?: string[]
  category?: string
  secondaryCategories?: string[]
  description?: string
}

interface HistoryEvent {
  summary?: string | null
  title?: string | null
  chapter: { number: number }
}

interface CharacterHistoryRecord {
  roles?: Array<{
    roleName: string
    fromEvent: HistoryEvent
    untilEvent?: HistoryEvent | null
  }>
  assignments?: Array<{
    officialRole: string
    fromEvent: HistoryEvent
    untilEvent?: HistoryEvent | null
  }>
  affiliations?: Array<{
    faction: { name: string }
    role: string
    status: string
    fromEvent: HistoryEvent
    untilEvent?: HistoryEvent | null
  }>
}

/** Normalises one catalogue entry, attaching the abilities that point at it. */
export function buildCharacterProfile(
  jsonCharacter: CatalogCharacterRecord,
  abilities: AbilityRecord[],
  firstVisibleChapter: number | null,
): CharacterProfile {
  return {
    id: jsonCharacter.id,
    slug: jsonCharacter.id,
    canonicalName: jsonCharacter.canonicalName || '',
    aliases: jsonCharacter.aliases || [],
    identity: jsonCharacter.identity || null,
    shipLocation: jsonCharacter.shipLocation || null,
    factionId: jsonCharacter.factionId || null,
    firstVisibleChapter,
    description: jsonCharacter.description || null,
    biography: jsonCharacter.biography || [],
    abilitiesAndPowers: jsonCharacter.abilitiesAndPowers || null,
    equipment: jsonCharacter.equipment || [],
    nen: jsonCharacter.nen || null,
    mangaAppearances: jsonCharacter.mangaAppearances || [],
    battles: jsonCharacter.battles || [],
    competitions: jsonCharacter.competitions || [],
    abilities: abilities.filter(
      (ability) =>
        ability.ownerId === jsonCharacter.id || ability.userIds?.includes(jsonCharacter.id),
    ),
  }
}

/**
 * Roles and official assignments as one chronological list.
 *
 * They are separate tables but the same thing to a reader: what this person
 * was, and until when.
 */
export function buildRoleHistory(character: CharacterHistoryRecord | null): HistoryEntry[] {
  return [
    ...(character?.roles || []).map((role) => ({
      label: role.roleName,
      chapter: role.fromEvent.chapter.number,
      untilChapter: role.untilEvent?.chapter.number || null,
      detail: eventDetail(role.fromEvent),
    })),
    ...(character?.assignments || []).map((assignment) => ({
      label: assignment.officialRole,
      chapter: assignment.fromEvent.chapter.number,
      untilChapter: assignment.untilEvent?.chapter.number || null,
      detail: eventDetail(assignment.fromEvent),
    })),
  ]
}

/** Faction memberships flattened to the chapters they span. */
export function buildAffiliations(character: CharacterHistoryRecord | null): AffiliationEntry[] {
  return (character?.affiliations || []).map((membership) => ({
    name: membership.faction.name,
    role: membership.role,
    status: membership.status,
    chapter: membership.fromEvent.chapter.number,
    untilChapter: membership.untilEvent?.chapter.number || null,
  }))
}

/**
 * The chapter a character may first be seen in, read off their catalogue id.
 *
 * Returns null when the catalogue has no first appearance, which means "no
 * restriction" — an unknown debut must not hide the character from everyone.
 */
export function readFirstAppearanceChapter(jsonCharacter: {
  firstAppearanceChapterId?: string | null
}): number | null {
  const match = jsonCharacter.firstAppearanceChapterId?.match(/ch-(\d+)/)
  return match ? Number.parseInt(match[1]) : null
}

/**
 * Whether a character may be shown to a reader who has stopped at `spoilerLimit`.
 *
 * An absent limit or an unknown debut both mean "no restriction". Parse the id
 * with readFirstAppearanceChapter rather than Number.parseInt: ids look like
 * 'ch-349', so a direct parse yields NaN and silently reveals everyone.
 */
export function isVisibleAtSpoilerLimit(
  jsonCharacter: { firstAppearanceChapterId?: string | null },
  spoilerLimit?: number,
): boolean {
  if (!spoilerLimit) return true
  const firstChapter = readFirstAppearanceChapter(jsonCharacter)
  return firstChapter === null || firstChapter <= spoilerLimit
}

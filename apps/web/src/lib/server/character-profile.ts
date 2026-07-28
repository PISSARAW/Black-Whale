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
  aliases: unknown[]
  identity: unknown
  shipLocation: unknown
  factionId: string | null
  firstVisibleChapter: number | null
  description: string | null
  biography: unknown[]
  abilitiesAndPowers: unknown
  equipment: unknown[]
  nen: unknown
  mangaAppearances: unknown[]
  battles: unknown[]
  competitions: unknown[]
  abilities: unknown[]
}

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

/** Normalises one catalogue entry, attaching the abilities that point at it. */
export function buildCharacterProfile(
  jsonCharacter: any,
  abilities: any[],
  firstVisibleChapter: number | null,
): CharacterProfile {
  return {
    id: jsonCharacter.id,
    slug: jsonCharacter.id,
    canonicalName: jsonCharacter.canonicalName,
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
export function buildRoleHistory(character: any): HistoryEntry[] {
  return [
    ...(character?.roles || []).map((role: any) => ({
      label: role.roleName,
      chapter: role.fromEvent.chapter.number,
      untilChapter: role.untilEvent?.chapter.number || null,
      detail: eventDetail(role.fromEvent),
    })),
    ...(character?.assignments || []).map((assignment: any) => ({
      label: assignment.officialRole,
      chapter: assignment.fromEvent.chapter.number,
      untilChapter: assignment.untilEvent?.chapter.number || null,
      detail: eventDetail(assignment.fromEvent),
    })),
  ]
}

/** Faction memberships flattened to the chapters they span. */
export function buildAffiliations(character: any): AffiliationEntry[] {
  return (character?.affiliations || []).map((membership: any) => ({
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
export function readFirstAppearanceChapter(jsonCharacter: any): number | null {
  const match = jsonCharacter.firstAppearanceChapterId?.match(/ch-(\d+)/)
  return match ? Number.parseInt(match[1]) : null
}

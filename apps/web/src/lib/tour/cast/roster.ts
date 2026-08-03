/**
 * The world state, read as a cast list.
 *
 * The one place the walk touches the timeline, and it touches it exactly where
 * `/ship` does: the presences of `getWorldState` at the selected event. The
 * tour does not re-derive positions from `mapTrajectory` — the map already does
 * that, once, in the compiler, and a second derivation is a divergence waiting
 * for the two to be edited apart. What comes out of here is the same set of
 * bodies the map draws markers for, trimmed to what a walkable room needs.
 *
 * Pure, and deliberately so: the server hands in rows and a catalogue, this
 * hands back a payload, and the whole projection is testable without a database.
 */
import type { CastBeast, CastMember, StandingBeast } from './types'

/** A body, as the world state gives it. */
export interface RosterBody {
  id: string
  originalCharacterId: string | null
}

/** Whose face a body is wearing, when it is not its own. */
export interface RosterAppearance {
  entityId: string
  appearanceCharacterId: string | null
}

/** A position, as the world state gives it. */
export interface RosterPresence {
  entityId: string
  locationId: string | null
  precision: string
  fromEvent?: { chapterId?: string | null } | null
}

/** A catalogue location, with the slug the blueprint names spaces by. */
export interface RosterLocation {
  id: string
  slug: string
  parentLocationId: string | null
}

/** A catalogue character, trimmed to what the walk reads off it. */
export interface RosterCharacter {
  id: string
  canonicalName: string
  shipLocation?: { role?: string } | null
  nen?: unknown
  guardianBeast?: {
    silhouette: string
    sourceChapterId: string
    standsWith?: string
  } | null
}

/** An ability, reduced to who owns it and what the walk would call it. */
export interface RosterAbility {
  ownerId: string | null
  /** The tour kind, or null for a technique the walk does not carry. */
  kind: string | null
}

export interface RosterInput {
  bodies: readonly RosterBody[]
  appearances: readonly RosterAppearance[]
  presences: readonly RosterPresence[]
  locations: readonly RosterLocation[]
  catalogue: readonly RosterCharacter[]
  abilities: readonly RosterAbility[]
}

/**
 * How precisely a position has to be known before the walk will stand somebody
 * in a room.
 *
 * The map can draw a marker over a whole deck and say so with a badge. A
 * corridor cannot: a body is either in the room with you or it is not, and
 * there is no way to stand in a place approximately. So anything short of a
 * room is left out — the person is still on the map, still in the archive, and
 * simply not in the walk.
 */
const EXACT = 'EXACT_ROOM'

/** A location and everything under it, by slug. */
function slugsUnder(locations: readonly RosterLocation[]): Map<string, string[]> {
  const children = new Map<string, RosterLocation[]>()
  for (const location of locations) {
    const parent = location.parentLocationId
    if (!parent) continue
    children.set(parent, [...(children.get(parent) ?? []), location])
  }
  const answer = new Map<string, string[]>()
  for (const location of locations) {
    const found: string[] = []
    const pending = [location]
    while (pending.length > 0) {
      const current = pending.pop()!
      found.push(current.slug)
      pending.push(...(children.get(current.id) ?? []))
    }
    answer.set(location.id, found)
  }
  // The ids the archive uses are slugs already in every file but the database's
  // own primary keys; keeping both spellings costs a line and saves a lookup
  // that silently answers nothing.
  for (const location of locations) {
    if (!answer.has(location.slug)) answer.set(location.slug, answer.get(location.id)!)
  }
  return answer
}

/** The beast a character declares, resolved to what the walk needs of it. */
function beastOf(character: RosterCharacter): CastBeast | null {
  const declared = character.guardianBeast
  if (!declared) return null
  return {
    ownerId: character.id,
    ownerName: character.canonicalName,
    silhouette: declared.silhouette as CastBeast['silhouette'],
    sourceChapterId: declared.sourceChapterId,
  }
}

/** Which techniques the walk carries for each owner, by character id. */
function repertoiresOf(abilities: readonly RosterAbility[]): Map<string, string[]> {
  const found = new Map<string, string[]>()
  for (const ability of abilities) {
    if (!ability.ownerId || !ability.kind) continue
    found.set(ability.ownerId, [...(found.get(ability.ownerId) ?? []), ability.kind])
  }
  return found
}

/** The indexes one pass over the world state needs, built once. */
function indexesOf(input: RosterInput) {
  return {
    bodies: new Map(input.bodies.map((body) => [body.id, body])),
    faces: new Map(input.appearances.map((one) => [one.entityId, one.appearanceCharacterId])),
    catalogue: new Map(input.catalogue.map((character) => [character.id, character])),
    under: slugsUnder(input.locations),
    repertoires: repertoiresOf(input.abilities),
  }
}

/** Whose face this body is wearing, falling back to whose body it is. */
function identityOf(entityId: string, indexes: ReturnType<typeof indexesOf>): string | null {
  const face = indexes.faces.get(entityId)
  if (face) return face
  return indexes.bodies.get(entityId)?.originalCharacterId ?? null
}

/** One catalogued person, as the walk reads them. */
function describe(
  character: RosterCharacter,
  presence: RosterPresence,
  indexes: ReturnType<typeof indexesOf>,
): CastMember {
  return {
    characterId: character.id,
    name: character.canonicalName,
    locations: indexes.under.get(presence.locationId ?? '') ?? [],
    role: character.shipLocation?.role ?? '',
    since: presence.fromEvent?.chapterId ?? null,
    nen: Boolean(character.nen),
    hatsu: indexes.repertoires.get(character.id) ?? [],
    beast: beastOf(character),
  }
}

/**
 * One presence, as a cast member — or null when it is not one the walk can use.
 *
 * The identity is read the way the map reads it: a body wearing somebody else's
 * face travels under that face, which is what keeps a revelation the reader has
 * not reached out of the corridor they are standing in.
 */
function memberFrom(
  presence: RosterPresence,
  indexes: ReturnType<typeof indexesOf>,
): CastMember | null {
  if (presence.precision !== EXACT || !presence.locationId) return null
  const characterId = identityOf(presence.entityId, indexes)
  const character = characterId ? indexes.catalogue.get(characterId) : undefined
  return character ? describe(character, presence, indexes) : null
}

/**
 * Who is aboard, where, at this event.
 *
 * The reader's cap has already been applied upstream — the world state is built
 * from events under it — so nothing past it can leak through this function,
 * because it was never in its input.
 */
export function rosterFrom(input: RosterInput): {
  members: CastMember[]
  beasts: StandingBeast[]
} {
  const indexes = indexesOf(input)
  const members: CastMember[] = []
  const placed = new Set<string>()
  for (const presence of input.presences) {
    const member = memberFrom(presence, indexes)
    if (!member || placed.has(member.characterId)) continue
    placed.add(member.characterId)
    members.push(member)
  }

  // Beasts whose owner the archive never places — the real Woble — and which
  // said, in `data/`, whose position they keep instead. Resolved here so the
  // walk never has to know that the substitution happened.
  const beasts: StandingBeast[] = []
  for (const character of input.catalogue) {
    const declared = character.guardianBeast
    if (!declared?.standsWith || placed.has(character.id)) continue
    const beast = beastOf(character)
    if (beast) beasts.push({ ...beast, standsWithId: declared.standsWith })
  }

  return { members, beasts }
}

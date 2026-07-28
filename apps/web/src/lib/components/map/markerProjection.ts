import type {
  AppearanceState,
  Belief,
  Body,
  BodyOccupancy,
  Character,
  Consciousness,
  Location,
  PerspectiveState,
  Presence,
  SubjectiveFact,
} from '@black-whale/domain'

import type {
  FollowMode,
  KnowledgeVisualState,
  MarkerIdentityState,
} from '$lib/components/perspective/types'
import { toEnglishDisplayName } from '$lib/utils/displayNames'

/**
 * Turning a world-state presence into a map marker.
 *
 * This lived inside `MapOverlay.svelte` as one 190-line `.map()` callback over
 * `any`, which is what made it the most complex function in the repository. The
 * engines already type everything it reads — `getWorldState()` returns a
 * `WorldSnapshot`, `buildPerspective()` a `PerspectiveState` — so the `any` was
 * erasing checks rather than standing in for missing ones.
 */

/** A character as the ship loader hands it over: the domain row plus roster tags. */
export type MapCharacter = Character & {
  factionTags?: string[]
  hatsuNames?: string[]
  hatsuIds?: string[]
}

/** A presence row with the two event relations the temporal badge reads. */
export type MapPresence = Presence & {
  fromEvent?: { sequence?: number | null; chapterId?: string | null } | null
  untilEvent?: { sequence?: number | null } | null
}

/** Only the event fields the projection consults. */
export type MapEvent = { id: string; chapterId?: string | null }

export interface MapWorldState {
  characters: MapCharacter[]
  bodies: Body[]
  consciousnesses: Consciousness[]
  presences: MapPresence[]
  occupancies: BodyOccupancy[]
  appearances: AppearanceState[]
  locations: Location[]
  bodyStates?: Record<string, string>
}

export interface MapNextChapterState extends MapWorldState {
  chapterNumber?: number
}

export type MapMarker = MarkerIdentityState & {
  tierId: string | null
  locationId?: string
  /** Catalogue slug of the body's owner, which is what `localSpotAnchors` keys on. */
  characterSlug?: string
  location?: Location | null
  overviewX: number
  overviewY: number
}

// ──────────────────────────────────────────────
// Geometry
// ──────────────────────────────────────────────

/**
 * Location slugs to SVG coordinates, per tier. Coordinates are expressed in the
 * shared `0 0 1000 600` viewBox of the tier maps.
 */
const locationCoordinates: Record<string, Record<string, { x: number; y: number }>> = {
  'tier-1': {
    'tier-1': { x: 500, y: 285 },
    'king-quarters': { x: 475, y: 160 },
    'king-living-quarters': { x: 475, y: 160 },
    'princes-burial-chamber': { x: 475, y: 110 },
    'banquet-hall': { x: 475, y: 255 },
    'vvip-living-quarters': { x: 290, y: 385 },
    'queens-living-quarters': { x: 422, y: 385 },
    'royal-residential-sector': { x: 530, y: 385 },
    'soldiers-living-quarters': { x: 652, y: 385 },
    casino: { x: 360, y: 385 },
    'vip-jail': { x: 790, y: 320 },
    'vvip-prison-beyond': { x: 790, y: 270 },
    'supreme-court': { x: 790, y: 410 },
    lifeboats: { x: 865, y: 300 },
  },
  'tier-2': {
    'tier-2': { x: 500, y: 300 },
    'heilly-secret-hideout': { x: 400, y: 225 },
    'vip-guest-rooms': { x: 400, y: 225 },
    'ministry-of-justice': { x: 660, y: 385 },
    'vip-witness-protection-area': { x: 660, y: 385 },
    bulkhead: { x: 500, y: 498 },
  },
  'tier-3': {
    'tier-3': { x: 500, y: 285 },
    'residential-units': { x: 270, y: 360 },
    'residential-room-3101': { x: 220, y: 195 },
    'central-hospital': { x: 500, y: 190 },
    'central-police-station': { x: 450, y: 385 },
    'central-courthouse': { x: 550, y: 385 },
    'political-ward': { x: 500, y: 385 },
    'heilly-family-office': { x: 715, y: 420 },
    cineplex: { x: 715, y: 160 },
    'observation-deck': { x: 715, y: 295 },
    'residential-first-class': { x: 270, y: 175 },
    'residential-standard': { x: 270, y: 370 },
  },
  'tier-4': {
    'tier-4': { x: 485, y: 300 },
    'central-passage': { x: 500, y: 525 },
    'recycling-sewage-facilities': { x: 500, y: 525 },
    'xi-yu-family-office': { x: 400, y: 300 },
    'royal-army-conference-room': { x: 575, y: 155 },
  },
  'tier-5': {
    'tier-5': { x: 450, y: 285 },
    'central-dining-hall': { x: 585, y: 370 },
    'standard-cabins': { x: 270, y: 290 },
    'recycling-facility': { x: 400, y: 300 },
    'medical-clinic': { x: 685, y: 375 },
    'cha-r-family-office': { x: 460, y: 375 },
    warehouse: { x: 560, y: 240 },
    'area-37564': { x: 270, y: 355 },
  },
}

/**
 * Room anchors inside a local map, as percentages of the local SVG box.
 *
 * A tier map draws a block as one region, so `locationCoordinates` stops at the
 * block. Zoomed into the block the rooms are drawn individually, and a marker
 * that ignores them lands in the corridor whatever room the archive assigned.
 * A slug listed here is placed in its own room; anything else keeps the centred
 * grid, which is still the right answer for a local map with no rooms drawn.
 */
const localRoomAnchors: Record<string, { x: number; y: number }> = Object.fromEntries(
  // Two rows of four around the private corridor, matching the room grid in
  // `local/queens-living-quarters.svelte`.
  Array.from({ length: 8 }, (_, index) => [
    `tier-1-queens-living-quarters-room-${String(index + 1).padStart(2, '0')}`,
    { x: 22.19 + (index % 4) * 18.13, y: index < 4 ? 30.83 : 69.17 },
  ]),
)

/**
 * Where inside a drawn room a passenger actually is, when canon says.
 *
 * `localRoomAnchors` answers "which room"; this answers "which corner of it".
 * Beyond Netero is not merely in his cell, he is manacled to the wall beside the
 * bed, and a marker floating over the middle of the floor contradicts the only
 * panel we have of the place. `occupants` places passengers canon puts somewhere
 * specific, and `fallback` catches everyone else the story sends into the room —
 * the Zodiacs watching Beyond belong on their side of the bars, not on his bed.
 *
 * Coordinates are percentages of the local SVG box, read off the fixtures the
 * room asset draws. Anything not listed keeps the centred grid.
 */
const localSpotAnchors: Record<
  string,
  { occupants: Record<string, { x: number; y: number }>; fallback?: { x: number; y: number } }
> = {
  // `local/beyond-cell.svelte`, 800 × 600, contents offset by (100, 100).
  'tier-1-vvip-prison-beyond': {
    // The bed, against the wall his right arm is bolted to.
    occupants: { 'beyond-netero': { x: 23.75, y: 54.17 } },
    // The guard half, past the bars: the Zodiacs' 24-hour watch.
    fallback: { x: 65.63, y: 50 },
  },
  // `local/vip-detention.svelte`, 1000 × 600, contents offset by (50, 80).
  'tier-1-vip-jail': {
    // The first-class cell, the one a detained princess is held in.
    occupants: { 'prince-camilla': { x: 27, y: 33.33 } },
  },

  // The prince apartments below share `local/prince-apartment.svelte`: 800 × 800,
  // contents offset by (50, 70), one bed drawn at (20, 550) 100 × 110 in the
  // master bedroom that spans x 0–500, y 530–680. No fallback is declared for
  // them — the centred grid already drops an unplaced passenger in the living
  // room, which is where an apartment holds anyone canon does not seat.

  // Kacho cries over the photos of her sister in bed, ch. 382, and it is the bed
  // Silent Majority comes to.
  'tier-1-royal-residential-sector-room-1010': {
    occupants: { 'prince-kacho': { x: 15, y: 84.38 } },
  },
  // Ch. 400 puts both twins in Fugetsu's bed, so they lie side by side on it:
  // the same fixture, offset by half its width rather than stacked.
  'tier-1-royal-residential-sector-room-1011': {
    occupants: {
      'prince-fugetsu': { x: 12.5, y: 84.38 },
      'prince-kacho': { x: 18, y: 84.38 },
    },
  },
  // Momoze is asleep in her bed in ch. 361, which is where Tuffdy kills her.
  'tier-1-royal-residential-sector-room-1012': {
    occupants: { 'prince-momoze': { x: 15, y: 84.38 } },
  },
  // Ch. 401: Kurapika and Bill take Longhi out of the Nen class and into 1014's
  // master bedroom, past the bed, for a lesson the room is not meant to hear.
  'tier-1-royal-residential-sector-room-1014': {
    occupants: { longhi: { x: 56.25, y: 86.25 } },
  },
}

/**
 * The spot a marker occupies inside its room, if the room declares any.
 *
 * `exact` separates the two cases the caller has to treat differently: a fixture
 * canon assigns to this passenger, which the marker sits on alone, and the
 * room's catch-all corner, which several markers share and must fan out across.
 */
function spotAnchorFor(marker: MapMarker): { x: number; y: number; exact: boolean } | null {
  const room = localSpotAnchors[marker.locationId ?? '']
  if (!room) return null
  const own = marker.characterSlug ? room.occupants[marker.characterSlug] : undefined
  if (own) return { ...own, exact: true }
  return room.fallback ? { ...room.fallback, exact: false } : null
}

export const tierVisuals: Record<string, { label: string; overviewY: number }> = {
  'tier-1': { label: 'Tier 1', overviewY: 21 },
  'tier-2': { label: 'Tier 2', overviewY: 31 },
  'tier-3': { label: 'Tier 3', overviewY: 46 },
  'tier-4': { label: 'Tier 4', overviewY: 63 },
  'tier-5': { label: 'Tier 5', overviewY: 78 },
}

export function resolveTierSlug(
  location: Location | null | undefined,
  byId: Map<string, Location>,
): string | null {
  let current = location
  let depth = 0

  while (current && depth < 8) {
    if (current.type === 'TIER') {
      return current.slug
    }
    const prefixedTier = current.slug?.match(/^(tier-[1-5])(?:-|$)/)?.[1]
    if (prefixedTier) return prefixedTier
    current = current.parentLocationId ? byId.get(current.parentLocationId) : null
    depth += 1
  }

  return null
}

export function belongsToLocation(
  location: Location | null | undefined,
  targetSlug: string,
  byId: Map<string, Location>,
): boolean {
  let current = location
  let depth = 0
  while (current && depth < 8) {
    if (current.slug === targetSlug || current.slug.endsWith(`-${targetSlug}`)) return true
    current = current.parentLocationId ? byId.get(current.parentLocationId) : null
    depth += 1
  }
  return false
}

function getExactTierCoordinates(tierId: string, locationSlug: string) {
  const tierCoordinates = locationCoordinates[tierId] || {}
  const coordinateKey = Object.keys(tierCoordinates)
    .sort((left, right) => right.length - left.length)
    .find((key) => locationSlug === key || locationSlug.endsWith(`-${key}`))
  const directCoordinates = coordinateKey ? tierCoordinates[coordinateKey] : undefined
  if (directCoordinates) return { ...directCoordinates, isSmallRoom: false }

  // Tier 1 rooms 1001–1014 are drawn as two vertical columns in tier-1.svelte.
  // Odd rooms are on the right, even rooms on the left.
  const princeRoomMatch = tierId === 'tier-1' ? locationSlug.match(/room-10(0[1-9]|1[0-4])$/) : null
  if (princeRoomMatch) {
    const roomNumber = Number(princeRoomMatch[1])
    const row = Math.floor((roomNumber - 1) / 2)
    return {
      x: roomNumber % 2 === 0 ? 477.5 : 582.5,
      y: 320.7 + row * 21.4,
      isSmallRoom: true,
    }
  }

  return null
}

function spreadAroundAnchor(
  anchor: { x: number; y: number; isSmallRoom?: boolean },
  index: number,
  count: number,
) {
  if (count <= 1) return { x: anchor.x, y: anchor.y }

  const columns = Math.min(anchor.isSmallRoom ? 2 : 6, Math.ceil(Math.sqrt(count)))
  const rows = Math.ceil(count / columns)
  const column = index % columns
  const row = Math.floor(index / columns)
  const spacingX = anchor.isSmallRoom ? 12 : 24
  const spacingY = anchor.isSmallRoom ? 8 : 20

  return {
    x: anchor.x + (column - (columns - 1) / 2) * spacingX,
    y: anchor.y + (row - (rows - 1) / 2) * spacingY,
  }
}

/** Entity ids sharing `anchorFilter`, sorted, so co-located markers fan out stably. */
function spreadAmong(
  presences: MapPresence[],
  entityId: string,
  anchor: { x: number; y: number; isSmallRoom?: boolean },
  matches: (candidate: MapPresence) => boolean,
) {
  const peers = presences
    .filter(matches)
    .map((candidate) => candidate.entityId)
    .sort()
  return spreadAroundAnchor(anchor, Math.max(0, peers.indexOf(entityId)), peers.length)
}

export function calculatePresencePosition(
  presence: MapPresence,
  sourcePresences: MapPresence[],
  sourceLocations: Location[],
) {
  const locationsById = new Map<string, Location>(
    sourceLocations.map((location) => [location.id, location]),
  )
  const loc = sourceLocations.find((location) => location.id === presence.locationId) || null
  const tierId = loc ? resolveTierSlug(loc, locationsById) : null

  if (!loc || !tierId || !locationCoordinates[tierId]) return { x: 500, y: 300, loc, tierId }

  const coords = getExactTierCoordinates(tierId, loc.slug)
  if (coords) {
    const { x, y } = spreadAmong(
      sourcePresences,
      presence.entityId,
      coords,
      (candidate) => candidate.locationId === presence.locationId,
    )
    return { x, y, loc, tierId }
  }

  const parent = loc.parentLocationId ? locationsById.get(loc.parentLocationId) : undefined
  const parentCoords = parent ? getExactTierCoordinates(tierId, parent.slug) : undefined
  if (parentCoords) {
    const { x, y } = spreadAmong(
      sourcePresences,
      presence.entityId,
      parentCoords,
      (candidate) =>
        locationsById.get(candidate.locationId ?? '')?.parentLocationId === loc.parentLocationId,
    )
    return { x, y, loc, tierId }
  }

  // Neither the room nor its parent is drawn: fall back to the tier anchor.
  const tierAnchor = getExactTierCoordinates(tierId, tierId) || { x: 500, y: 300 }
  const { x, y } = spreadAmong(sourcePresences, presence.entityId, tierAnchor, (candidate) => {
    const candidateLocation = locationsById.get(candidate.locationId ?? '')
    return Boolean(
      candidateLocation && resolveTierSlug(candidateLocation, locationsById) === tierId,
    )
  })
  return { x, y, loc, tierId }
}

export function getTemporalVisual(
  presence: MapPresence,
  currentEvent: MapEvent | null | undefined,
  currentSequence: number,
) {
  if (presence.certainty === 'PROBABLE') {
    return { color: '#f0b75e', label: 'Assumed position', detail: 'Likely presence, unconfirmed' }
  }
  if (presence.certainty === 'LAST_KNOWN') {
    return {
      color: '#e47f61',
      label: 'Last known position',
      detail: 'Potentially outdated information',
    }
  }
  if (presence.certainty !== 'CONFIRMED') {
    return { color: '#8a9798', label: 'Unknown status', detail: 'Certainty level not provided' }
  }

  const fromSequence = presence.fromEvent?.sequence
  const untilSequence = presence.untilEvent?.sequence

  if (untilSequence !== undefined && untilSequence !== null) {
    return {
      color: '#ad8bea',
      label: 'Confirmed over a period',
      detail: `Events ${fromSequence ?? '?'} to ${untilSequence}`,
    }
  }
  if (presence.fromEventId === currentEvent?.id) {
    return {
      color: '#55d1e2',
      label: 'Confirmed at this event',
      detail: `Event ${currentSequence}`,
    }
  }
  if (presence.fromEvent?.chapterId && presence.fromEvent.chapterId === currentEvent?.chapterId) {
    return {
      color: '#6ac890',
      label: 'Confirmed during this chapter',
      detail: `Since event ${fromSequence ?? '?'}`,
    }
  }
  return {
    color: '#5bb9ad',
    label: 'Confirmed presence',
    detail: `Since event ${fromSequence ?? '?'}`,
  }
}

// ──────────────────────────────────────────────
// Projection
// ──────────────────────────────────────────────

interface PresenceEntities {
  body?: Body
  appearanceState?: AppearanceState
  structuralApparentCharacter?: MapCharacter
  biologicalOwner?: MapCharacter
  ownerCharacter?: MapCharacter
  activeConsciousness?: Consciousness
  consciousnessOwner?: MapCharacter
}

/** Walks presence → body → occupancy → consciousness → the characters behind each. */
function resolveEntities(entityId: string, world: MapWorldState): PresenceEntities {
  const body = world.bodies.find((candidate) => candidate.id === entityId)
  const appearanceState = world.appearances.find((candidate) => candidate.entityId === entityId)
  const structuralApparentCharacter = appearanceState
    ? world.characters.find((candidate) => candidate.id === appearanceState.appearanceCharacterId)
    : undefined
  const biologicalOwner = body
    ? world.characters.find((candidate) => candidate.id === body.originalCharacterId)
    : undefined
  const occupancy = world.occupancies.find((candidate) => candidate.bodyId === entityId)
  const activeConsciousness = occupancy
    ? world.consciousnesses.find((candidate) => candidate.id === occupancy.consciousnessId)
    : undefined
  const consciousnessOwner = activeConsciousness?.originCharacterId
    ? world.characters.find((candidate) => candidate.id === activeConsciousness.originCharacterId)
    : undefined

  return {
    body,
    appearanceState,
    structuralApparentCharacter,
    biologicalOwner,
    ownerCharacter: biologicalOwner || structuralApparentCharacter,
    activeConsciousness,
    consciousnessOwner,
  }
}

interface KnowledgeView {
  relatedFacts: SubjectiveFact[]
  relatedBeliefs: Belief[]
  isObserverBody: boolean
  hasConfirmedKnowledge: boolean
  hasBeliefOnly: boolean
  observerCharacter?: MapCharacter
  observerApparentCharacter?: MapCharacter
}

/** What the current observer knows, believes, or merely suspects about this body. */
function resolveKnowledge(
  entityId: string,
  body: Body,
  world: MapWorldState,
  perspective: PerspectiveState | null,
): KnowledgeView {
  const observer = perspective?.observer
  const ownerId = body.originalCharacterId

  const relatedFacts = (perspective?.knownFacts || []).filter(
    (fact) => fact.subjectId === entityId || fact.subjectId === ownerId,
  )
  const relatedBeliefs = (perspective?.beliefs || []).filter(
    (belief) => belief.subjectId === entityId || belief.subjectId === ownerId,
  )

  const knownCharacterIds = new Set<string>(perspective?.knownCharacters || [])
  const isObserverBody = Boolean(observer?.currentBodyId && observer.currentBodyId === entityId)
  const hasConfirmedKnowledge =
    isObserverBody || Boolean(ownerId && knownCharacterIds.has(ownerId)) || relatedFacts.length > 0

  return {
    relatedFacts,
    relatedBeliefs,
    isObserverBody,
    hasConfirmedKnowledge,
    hasBeliefOnly: !hasConfirmedKnowledge && relatedBeliefs.length > 0,
    observerCharacter: world.characters.find((character) => character.id === observer?.characterId),
    observerApparentCharacter: world.characters.find(
      (character) => character.id === observer?.apparentCharacterId,
    ),
  }
}

/**
 * A contested fact outranks everything: the observer holds a belief the world
 * denies, and the marker has to say so rather than quietly showing either side.
 */
function resolveKnowledgeState(
  presence: MapPresence,
  knowledge: KnowledgeView,
): KnowledgeVisualState {
  if (knowledge.relatedFacts.some((fact) => fact.truthStatus === 'CONTESTED')) return 'contradicted'
  if (knowledge.hasConfirmedKnowledge) return 'confirmed'
  if (knowledge.hasBeliefOnly) return 'believed'
  if (presence.certainty === 'CONFIRMED') return 'confirmed'
  if (presence.certainty === 'PROBABLE') return 'suspected'
  if (presence.certainty === 'LAST_KNOWN') return 'outdated'
  return 'unknown'
}

interface IdentityNames {
  bodyName: string
  consciousness: string
  appearance: string
  perceivedIdentity: string
}

/** The names the world state carries, before any observer is taken into account. */
function structuralNames(entities: PresenceEntities) {
  const bodyName =
    toEnglishDisplayName(entities.biologicalOwner?.canonicalName || entities.body?.label) ||
    'Unknown body'

  return {
    bodyName,
    consciousnessName: toEnglishDisplayName(
      entities.consciousnessOwner?.canonicalName || entities.activeConsciousness?.label || bodyName,
    ),
    appearanceName: toEnglishDisplayName(
      entities.structuralApparentCharacter?.canonicalName || bodyName,
    ),
  }
}

/**
 * The observer looking at their own body knows it from the inside, so the
 * perspective's own identity outranks whatever the world state records.
 */
function observedNames(
  structural: ReturnType<typeof structuralNames>,
  knowledge: KnowledgeView,
  perspective: PerspectiveState | null,
) {
  if (!knowledge.isObserverBody) {
    return { consciousness: structural.consciousnessName, appearance: structural.appearanceName }
  }

  return {
    consciousness:
      knowledge.observerCharacter?.canonicalName ||
      perspective?.observer?.consciousnessId ||
      structural.consciousnessName,
    appearance: knowledge.observerApparentCharacter?.canonicalName || structural.appearanceName,
  }
}

/**
 * What this observer is allowed to see. An observer who cannot confirm the
 * identity must not be shown the name: they get the apparent identity, or
 * nothing at all when even that is unknown.
 */
function perceivedName(
  followedIdentity: string,
  appearance: string,
  knowledge: KnowledgeView,
  perspectiveIsReader: boolean,
) {
  if (perspectiveIsReader || knowledge.isObserverBody) return followedIdentity
  if (knowledge.hasConfirmedKnowledge) return appearance
  return knowledge.hasBeliefOnly ? 'Assumed identity' : 'Unknown individual'
}

/** The three identity axes, then the one the visitor is actually shown. */
function resolveIdentityNames(
  entities: PresenceEntities,
  knowledge: KnowledgeView,
  perspective: PerspectiveState | null,
  followMode: FollowMode,
  perspectiveIsReader: boolean,
): IdentityNames {
  const structural = structuralNames(entities)
  const { consciousness, appearance } = observedNames(structural, knowledge, perspective)

  const followedIdentity =
    followMode === 'body'
      ? structural.bodyName
      : followMode === 'appearance'
        ? appearance
        : consciousness

  return {
    bodyName: structural.bodyName,
    consciousness,
    appearance,
    perceivedIdentity: perceivedName(followedIdentity, appearance, knowledge, perspectiveIsReader),
  }
}

/** Where the marker's claim comes from, so the panel can cite it. */
function resolveSourceLabel(knowledge: KnowledgeView) {
  const predicate = knowledge.relatedFacts[0]?.predicate || knowledge.relatedBeliefs[0]?.predicate
  if (knowledge.hasConfirmedKnowledge) return `Fact: ${predicate}`
  if (knowledge.hasBeliefOnly) return `Belief: ${predicate}`
  return 'Structural presence'
}

/** The character the follow mode is tracking, which need not be the body's owner. */
function resolveFollowedCharacter(entities: PresenceEntities, followMode: FollowMode) {
  if (followMode === 'consciousness') return entities.consciousnessOwner
  if (followMode === 'appearance')
    return entities.structuralApparentCharacter || entities.biologicalOwner
  return entities.biologicalOwner
}

/** True when the consciousness in this body originated in someone else. */
function hasConsciousnessTransfer(body: Body, entities: PresenceEntities) {
  const origin = entities.activeConsciousness?.originCharacterId
  return Boolean(origin && body.originalCharacterId !== origin)
}

/** What the next chapter does to this presence, previewed by the parallel future. */
function resolveFutureChange(
  presence: MapPresence,
  next: MapNextChapterState | null,
): 'stable' | 'moved' | 'dead' {
  const biologicalState = next?.bodyStates?.[presence.entityId]
  if (biologicalState === 'DEAD' || biologicalState === 'DESTROYED') return 'dead'

  const nextPresence = next?.presences?.find(
    (candidate) => candidate.entityId === presence.entityId,
  )
  if (nextPresence && nextPresence.locationId !== presence.locationId) return 'moved'
  return 'stable'
}

export interface ProjectionContext {
  world: MapWorldState
  perspective: PerspectiveState | null
  nextChapterState: MapNextChapterState | null
  followMode: FollowMode
  perspectiveIsReader: boolean
  currentEvent: MapEvent | null
  currentSequence: number
}

/**
 * Returns null when the presence has no place on a tier map: an unknown body,
 * an unresolved owner, or a position the ship maps do not draw. Those belong in
 * the dedicated unknown-positions manifest, not at fallback coordinates.
 */
export function projectPresenceMarker(
  presence: MapPresence,
  context: ProjectionContext,
): MapMarker | null {
  const { world, perspective, nextChapterState, followMode, perspectiveIsReader } = context

  const entities = resolveEntities(presence.entityId, world)
  const { body, ownerCharacter } = entities
  const { x, y, loc, tierId } = calculatePresencePosition(
    presence,
    world.presences,
    world.locations,
  )

  if (!body || !ownerCharacter || !loc || loc.type === 'UNKNOWN') return null

  const knowledge = resolveKnowledge(presence.entityId, body, world, perspective)
  const names = resolveIdentityNames(
    entities,
    knowledge,
    perspective,
    followMode,
    perspectiveIsReader,
  )

  const visual = tierId ? tierVisuals[tierId] : undefined
  const temporalVisual = getTemporalVisual(presence, context.currentEvent, context.currentSequence)
  const followedCharacter = resolveFollowedCharacter(entities, followMode)

  return {
    id: presence.entityId,
    tierId,
    locationId: loc.slug,
    characterSlug: ownerCharacter.slug,
    location: loc,
    overviewX: 50,
    overviewY: visual?.overviewY ?? 46,
    x: x / 10,
    y: y / 6,
    body: names.bodyName,
    consciousness: names.consciousness,
    appearance: names.appearance,
    perceivedIdentity: names.perceivedIdentity,
    transferFlag:
      hasConsciousnessTransfer(body, entities) ||
      (knowledge.isObserverBody && Boolean(perspective?.observer?.isDissonant)),
    suspicionLabel:
      !perspectiveIsReader && knowledge.hasBeliefOnly ? 'Active suspicion' : undefined,
    knowledgeState: resolveKnowledgeState(presence, knowledge),
    sourceLabel: resolveSourceLabel(knowledge),
    sinceLabel: presence.fromEventId ? `since ${presence.fromEventId}` : 'unknown event',
    positionColor: temporalVisual.color,
    tierLabel: visual?.label || 'Outside tier',
    locationLabel: loc.name || 'Unknown position',
    temporalLabel: temporalVisual.label,
    temporalDetail: temporalVisual.detail,
    factionTags: ownerCharacter.factionTags || [],
    isFollowTarget: knowledge.isObserverBody,
    originalCharacterId: followedCharacter?.id || ownerCharacter.id,
    hatsuNames: ownerCharacter.hatsuNames || [],
    hatsuIds: ownerCharacter.hatsuIds || [],
    futureChange: resolveFutureChange(presence, nextChapterState),
  }
}

/**
 * The parallel-future overlay. It has no perspective to respect — it shows the
 * next chapter as the reader will find it — so it skips the identity masking
 * entirely and only needs a name and a position.
 */
export function projectFutureMarker(
  presence: MapPresence,
  next: MapNextChapterState,
  fallbackLocations: Location[],
): MapMarker | null {
  const body = next.bodies.find((candidate) => candidate.id === presence.entityId)
  const character = body
    ? next.characters.find((candidate) => candidate.id === body.originalCharacterId)
    : null
  const biologicalState = next.bodyStates?.[presence.entityId]
  if (!body || !character || biologicalState === 'DEAD' || biologicalState === 'DESTROYED')
    return null

  const { x, y, loc, tierId } = calculatePresencePosition(
    presence,
    next.presences,
    next.locations.length ? next.locations : fallbackLocations,
  )
  const visual = tierId ? tierVisuals[tierId] : undefined
  const name = toEnglishDisplayName(character.canonicalName)

  return {
    id: presence.entityId,
    x: x / 10,
    y: y / 6,
    body: name,
    consciousness: name,
    appearance: name,
    perceivedIdentity: `${name} · Ch. ${next.chapterNumber}`,
    knowledgeState: 'confirmed',
    positionColor: '#d598ff',
    tierLabel: visual?.label || 'Outside tier',
    locationLabel: loc?.name || 'Unknown future position',
    temporalLabel: 'Parallel future',
    temporalDetail: `Position in chapter ${next.chapterNumber}`,
    tierId,
    locationId: loc?.slug,
    characterSlug: character.slug,
    location: loc,
    overviewX: 50,
    overviewY: visual?.overviewY ?? 46,
    hatsuNames: character.hatsuNames || [],
    hatsuIds: character.hatsuIds || [],
  }
}

// ──────────────────────────────────────────────
// Layout
// ──────────────────────────────────────────────

export type ZoomLevel = 'OVERVIEW' | 'TIER' | 'LOCAL'

/**
 * Spreads markers so they stop overlapping at the current zoom. Overview packs
 * each tier into its own band of up to twelve columns; local view grids the
 * whole set around the centre; tier view keeps the computed coordinates.
 *
 * Both the present and the parallel-future overlays used to carry an identical
 * copy of this block.
 */
export function packMarkersForZoom<T extends MapMarker>(markers: T[], zoom: ZoomLevel): T[] {
  if (zoom === 'TIER') return markers

  if (zoom === 'LOCAL') {
    // A spot inside the room outranks the room itself, which outranks the
    // centred grid. Markers with either kind of anchor leave the grid, and the
    // rest must be counted among themselves, or a single anchored marker would
    // still shift everyone else off centre.
    const unanchored = markers.filter(
      (marker) => !spotAnchorFor(marker) && !localRoomAnchors[marker.locationId ?? ''],
    )
    const columns = Math.min(6, Math.ceil(Math.sqrt(unanchored.length)))
    const rows = Math.ceil(unanchored.length / columns)

    return markers.map((marker) => {
      const spot = spotAnchorFor(marker)
      if (spot?.exact) {
        // Canon names this fixture for this passenger, so the marker sits on it
        // rather than being fanned out with the rest of the room.
        return { ...marker, x: spot.x, y: spot.y }
      }
      if (spot) {
        // Everyone the room catches by default shares one corner, so they do
        // have to fan out — the guard side of a cell holds a whole watch.
        const peers = markers
          .filter((peer) => !spotAnchorFor(peer)?.exact && peer.locationId === marker.locationId)
          .map((peer) => peer.id)
          .sort()
        const seat = Math.max(0, peers.indexOf(marker.id))
        return { ...marker, x: spot.x + (seat % 3) * 4, y: spot.y + Math.floor(seat / 3) * 5 }
      }

      const anchor = localRoomAnchors[marker.locationId ?? '']
      if (anchor) {
        // A room is 17% of the box wide and 25% tall, so occupants fan out in
        // steps small enough to stay inside their own walls.
        const roommates = markers
          .filter((peer) => peer.locationId === marker.locationId)
          .map((peer) => peer.id)
          .sort()
        const seat = Math.max(0, roommates.indexOf(marker.id))
        const roomColumns = Math.min(2, roommates.length)
        const roomRows = Math.ceil(roommates.length / roomColumns)
        return {
          ...marker,
          x: anchor.x + ((seat % roomColumns) - (roomColumns - 1) / 2) * 5,
          y: anchor.y + (Math.floor(seat / roomColumns) - (roomRows - 1) / 2) * 5,
        }
      }

      const index = Math.max(
        0,
        unanchored.findIndex((peer) => peer.id === marker.id),
      )
      return {
        ...marker,
        x: 50 + ((index % columns) - (columns - 1) / 2) * 3,
        y: 50 + (Math.floor(index / columns) - (rows - 1) / 2) * 3,
      }
    })
  }

  const tierGroups = new Map<string, T[]>()
  for (const marker of markers) {
    const key = marker.tierId || 'outside'
    const group = tierGroups.get(key) || []
    group.push(marker)
    tierGroups.set(key, group)
  }
  for (const group of tierGroups.values())
    group.sort((left, right) => left.id.localeCompare(right.id))

  return markers.map((marker) => {
    const group = tierGroups.get(marker.tierId || 'outside') || [marker]
    const index = Math.max(
      0,
      group.findIndex((candidate) => candidate.id === marker.id),
    )
    const columns = Math.min(12, group.length)
    const rows = Math.ceil(group.length / columns)
    return {
      ...marker,
      x: 38 + ((index % columns) + 0.5) * (24 / columns),
      y: marker.overviewY + (Math.floor(index / columns) - (rows - 1) / 2) * 1.8,
    }
  })
}

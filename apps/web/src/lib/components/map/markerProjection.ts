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
import { displayName } from '$lib/utils/displayNames'
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'

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
    'screening-room': { x: 375, y: 385 },
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
 *
 * Every spot carries what it is worth. A local map draws a point per marker
 * whether the story gave one or not, so without this the passenger canon shows
 * asleep in a named bed and the passenger canon only ever puts "in room 1004"
 * render identically — the map would be claiming precision the chapters never
 * granted. `inferred` marks the spots that are a reading of the scene rather
 * than a panel: a bodyguard beside the person they guard, a delegation at the
 * only table their cabin has. Unlisted passengers claim nothing at all and say
 * so in the tooltip.
 */
type Spot = { x: number; y: number; inferred?: true }

const localSpotAnchors: Record<string, { occupants: Record<string, Spot>; fallback?: Spot }> = {
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
  // contents offset by (50, 70). The shared plan draws a bed at (20, 550)
  // 100 × 110 in the master bedroom, a living-room table at (300, 350) 80 × 60,
  // and the asset adds one per-room fixture where canon seats a prince on
  // something of his own. No fallback is declared for any of them — the centred
  // grid already drops an unplaced passenger in the living room, which is where
  // an apartment holds everyone canon does not seat.
  //
  // A spot is the passenger's habitual place across the arc, not a freeze-frame:
  // Tserriednich stands over the water glass in ch. 376 and is on his training
  // floor in seven other chapters, so the training floor is what the room shows.

  // Benjamin takes his reports from the command post, ch. 363, 389 and 413.
  'tier-1-royal-residential-sector-room-1001': {
    occupants: { 'prince-benjamin': { x: 75, y: 63.13 } },
  },
  // Camilla holds court from the massage table, ch. 413.
  'tier-1-royal-residential-sector-room-1002': {
    occupants: { 'prince-camilla': { x: 26.88, y: 50 } },
  },
  // Zhang Lei works the ZhangCoins from the low table, ch. 374 to 404.
  'tier-1-royal-residential-sector-room-1003': {
    occupants: { 'prince-zhanglei': { x: 48.75, y: 56.25 } },
  },
  // Tserriednich drills Zetsu on his training floor; Theta is laid on a bed
  // after his Nen beast marks her in ch. 385, with Salkov at her side.
  'tier-1-royal-residential-sector-room-1004': {
    occupants: {
      'prince-tserriednich': { x: 74.38, y: 63.13 },
      theta: { x: 15, y: 84.38 },
      // Salkov is at her side through the scene; the panels frame the two of
      // them, not the corner of the room they are in.
      salkov: { x: 22, y: 84.38, inferred: true },
    },
  },
  // Tyson preaches from her seat, her disciples ranged in front, ch. 375.
  'tier-1-royal-residential-sector-room-1006': {
    occupants: { 'prince-tyson': { x: 28.13, y: 50 } },
  },
  // Luzurus does not get off this couch between ch. 362 and ch. 414.
  'tier-1-royal-residential-sector-room-1007': {
    occupants: { 'prince-luzurus': { x: 29.38, y: 65 } },
  },
  // Salé-salé holds his permanent party from the bed, ch. 362 to his murder.
  'tier-1-royal-residential-sector-room-1008': {
    occupants: { 'prince-salesale': { x: 15, y: 84.38 } },
  },
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
  // Hanzo leaves his body on the bed while his Nen double hunts Tuffdy, ch. 372,
  // and climbs back into it there in ch. 375.
  'tier-1-royal-residential-sector-room-1013': {
    occupants: { hanzo: { x: 15, y: 84.38 } },
  },
  // 1014 is the room the arc stages most often, so it carries the most spots.
  // Kurapika stands at the front of the Nen class facing the students, who keep
  // the centred grid above him; the guarded side of the room — cradle, queen,
  // her two bodyguards — sits between the class and the master bedroom. Two
  // bodies never leave the places they fell in: Woody on the bathroom floor
  // (ch. 359) and Vincent by the entrance (ch. 364).
  'tier-1-royal-residential-sector-room-1014': {
    occupants: {
      kurapika: { x: 50, y: 72 },
      // Oito swapped the babies, so the cradle holds whichever one the archive
      // currently believes is in it.
      'prince-woble': { x: 75, y: 66.88 },
      'oito-nephew-fake-woble': { x: 75, y: 66.88 },
      'queen-oito': { x: 69, y: 66.88 },
      // The two bodyguards keep the protected side of the room. Canon says
      // that much and never places them against a fixture.
      bill: { x: 69, y: 61, inferred: true },
      shimanu: { x: 81, y: 61, inferred: true },
      longhi: { x: 56.25, y: 86.25 },
      woody: { x: 81.25, y: 86.25 },
      vincent: { x: 50, y: 16.25 },
      // Silent Majority drops these two on the classroom floor itself, in front
      // of the students it is hiding among — ch. 369 and ch. 370.
      barrigen: { x: 40, y: 62 },
      myuhan: { x: 60, y: 62 },
    },
  },

  // `local/justice-bureau.svelte`, 1000 × 700, contents offset by (60, 90).
  // Melody and Kaiser are questioned across the interrogation table in ch. 386
  // and ch. 400; nobody else in the bureau is placed, so there is no fallback.
  'tier-2-ministry-of-justice': {
    occupants: { melody: { x: 74, y: 30 }, kaiser: { x: 82, y: 30 } },
  },
  // Witness protection is a room the bureau plan draws but the archive files as
  // its own location, so without an anchor everyone confined there landed in the
  // middle of the whole bureau. Fugetsu and Without You are the only occupants
  // and canon keeps them together, so the whole location shares the safe area.
  'tier-2-vip-witness-protection-area': {
    occupants: {},
    fallback: { x: 28, y: 67.86, inferred: true },
  },

  // `local/king-quarters.svelte`, 900 × 650, contents offset by (75, 75).
  // Nasubi receives from the central seat, ch. 382; the bier the asset now draws
  // holds Halkenburg in ch. 413, his father standing over him.
  'tier-1-king-living-quarters': {
    occupants: {
      'nasubi-hui-guo-rou': { x: 50, y: 50.38 },
      'prince-halkenburg': { x: 50, y: 78.46 },
    },
  },
  // `local/heilly-hideout.svelte`, 1100 × 760, contents offset by (55, 95).
  // Morena runs Heil-Ly from the head of the communal table, ch. 378 onward, and
  // ch. 407–410 seat Borksen at the far end for the negotiation game.
  'tier-2-heilly-secret-hideout': {
    occupants: {
      'morena-prudo': { x: 50.45, y: 82.24 },
      borksen: { x: 62.27, y: 82.24 },
    },
  },
  // `local/tier3-cabins.svelte`, 1000 × 600, contents offset by (50, 80).
  // The Zodiacs work the expedition maps around the strategy table in ch. 359;
  // the fallback is the table, so the whole delegation gathers at it. Fugetsu
  // hides in the same block in ch. 380 and gets the bed instead.
  'tier-3-residential-first-class': {
    occupants: { 'prince-fugetsu': { x: 45, y: 91.67, inferred: true } },
    fallback: { x: 55, y: 91.67, inferred: true },
  },
  // `local/lifeboats.svelte`, 1000 × 600, contents offset by (50, 80).
  // The twins board the same pod in ch. 383; Keeney holds the emergency door.
  'tier-1-lifeboats': {
    occupants: {
      'prince-kacho': { x: 30.5, y: 55 },
      'prince-fugetsu': { x: 34.5, y: 55 },
      // Keeney lets them through the emergency door; the post is his role,
      // not a panel.
      keeney: { x: 9, y: 31.67, inferred: true },
    },
  },
  // `local/casino.svelte`, 1000 × 600, contents offset by (50, 80).
  // Hisoka plays the unconventional variants in ch. 405.
  'tier-1-vip-casino': {
    occupants: { hisoka: { x: 60, y: 46.67 } },
  },
  // `local/cineplex.svelte`, 1000 × 600, contents offset by (50, 80).
  // Bonolenov watches from the seating area in ch. 393, wearing Hisoka's face.
  'tier-3-cineplex': {
    occupants: { 'bonolenov-ndongo': { x: 25, y: 84.17 } },
  },
  // `local/central-dining-hall.svelte`, 1000 × 600, contents offset by (50, 80).
  // The Troupe gathers information from the foreground table, ch. 371 and 377.
  'tier-5-central-dining-hall': {
    occupants: {},
    fallback: { x: 55, y: 66.67, inferred: true },
  },
  // `local/cha-r-office.svelte`, 1000 × 680, contents offset by (70, 90).
  // Tajao and Wang hold the main office table in ch. 405–406. Luini is not
  // placed: he comes through a hole in a wall the plan does not draw.
  'tier-5-cha-r-family-office': {
    occupants: {
      tajao: { x: 25, y: 41.18, inferred: true },
      'keni-wang': { x: 30, y: 41.18, inferred: true },
    },
  },
}

/**
 * The spot a marker occupies inside its room, if the room declares any.
 *
 * `exact` separates the two cases the caller has to treat differently: a fixture
 * canon assigns to this passenger, which the marker sits on alone, and the
 * room's catch-all corner, which several markers share and must fan out across.
 */
function spotAnchorFor(marker: MapMarker): (Spot & { exact: boolean }) | null {
  const room = localSpotAnchors[marker.locationId ?? '']
  if (!room) return null
  const own = marker.characterSlug ? room.occupants[marker.characterSlug] : undefined
  if (own) return { ...own, exact: true }
  return room.fallback ? { ...room.fallback, exact: false } : null
}

/**
 * What a local marker's position inside its room is worth, as the tooltip says it.
 *
 * A depicted spot needs no note: the marker is where the panel put the person.
 * The other two do. An inferred spot is the archive reading a scene rather than
 * copying it, and no spot at all means the room is the whole of the claim — the
 * marker still has to be drawn somewhere, and the grid position it gets is an
 * artefact of drawing it, not a statement about the room.
 */
function spotNoteFor(
  spot: { inferred?: true } | null,
  locale: Locale = DEFAULT_LOCALE,
): string | undefined {
  const m = messagesFor(locale).map
  if (!spot) return m.roomConfirmed
  return spot.inferred ? m.spotInferred : undefined
}

/** Where each deck sits in the overview; the label is built from the catalogue. */
export const tierOverviewY: Record<string, number> = {
  'tier-1': 21,
  'tier-2': 31,
  'tier-3': 46,
  'tier-4': 63,
  'tier-5': 78,
}

export function tierLabelFor(tierId: string, locale: Locale = DEFAULT_LOCALE): string {
  const number = tierId.replace('tier-', '')
  return messagesFor(locale).ship.tierLabel(number)
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
  locale: Locale = DEFAULT_LOCALE,
) {
  const m = messagesFor(locale).map.temporal

  if (presence.certainty === 'PROBABLE') {
    return { color: '#f0b75e', label: m.assumedPosition, detail: m.assumedDetail }
  }
  if (presence.certainty === 'LAST_KNOWN') {
    return { color: '#e47f61', label: m.lastKnown, detail: m.lastKnownDetail }
  }
  if (presence.certainty !== 'CONFIRMED') {
    return { color: '#8a9798', label: m.unknownStatus, detail: m.unknownDetail }
  }

  const fromSequence = presence.fromEvent?.sequence
  const untilSequence = presence.untilEvent?.sequence

  if (untilSequence !== undefined && untilSequence !== null) {
    return {
      color: '#ad8bea',
      label: m.confirmedPeriod,
      detail: m.periodDetail(fromSequence ?? '?', untilSequence),
    }
  }
  if (presence.fromEventId === currentEvent?.id) {
    return {
      color: '#55d1e2',
      label: m.confirmedAtEvent,
      detail: m.eventDetail(currentSequence),
    }
  }
  if (presence.fromEvent?.chapterId && presence.fromEvent.chapterId === currentEvent?.chapterId) {
    return {
      color: '#6ac890',
      label: m.confirmedInChapter,
      detail: m.sinceDetail(fromSequence ?? '?'),
    }
  }
  return {
    color: '#5bb9ad',
    label: m.confirmedPresence,
    detail: m.sinceDetail(fromSequence ?? '?'),
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
function structuralNames(entities: PresenceEntities, locale: Locale) {
  const bodyName =
    displayName(entities.biologicalOwner?.canonicalName || entities.body?.label, locale) ||
    messagesFor(locale).map.unknownBody

  return {
    bodyName,
    consciousnessName: displayName(
      entities.consciousnessOwner?.canonicalName || entities.activeConsciousness?.label || bodyName,
      locale,
    ),
    appearanceName: displayName(
      entities.structuralApparentCharacter?.canonicalName || bodyName,
      locale,
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
  locale: Locale,
) {
  if (perspectiveIsReader || knowledge.isObserverBody) return followedIdentity
  if (knowledge.hasConfirmedKnowledge) return appearance
  const m = messagesFor(locale).map
  return knowledge.hasBeliefOnly ? m.assumedIdentity : m.unknownIndividual
}

/** The three identity axes, then the one the visitor is actually shown. */
function resolveIdentityNames(
  entities: PresenceEntities,
  knowledge: KnowledgeView,
  perspective: PerspectiveState | null,
  followMode: FollowMode,
  perspectiveIsReader: boolean,
  locale: Locale,
): IdentityNames {
  const structural = structuralNames(entities, locale)
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
    perceivedIdentity: perceivedName(
      followedIdentity,
      appearance,
      knowledge,
      perspectiveIsReader,
      locale,
    ),
  }
}

/** Where the marker's claim comes from, so the panel can cite it. */
function resolveSourceLabel(knowledge: KnowledgeView, locale: Locale) {
  const m = messagesFor(locale).map
  const predicate = knowledge.relatedFacts[0]?.predicate || knowledge.relatedBeliefs[0]?.predicate
  if (knowledge.hasConfirmedKnowledge) return m.factSource(predicate)
  if (knowledge.hasBeliefOnly) return m.beliefSource(predicate)
  return m.structuralPresence
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
  /** Names come out of a partly French catalogue; the locale decides whether they are anglicised. */
  locale?: Locale
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
  const {
    world,
    perspective,
    nextChapterState,
    followMode,
    perspectiveIsReader,
    locale = DEFAULT_LOCALE,
  } = context

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
    locale,
  )

  const messages = messagesFor(locale).map
  const temporalVisual = getTemporalVisual(
    presence,
    context.currentEvent,
    context.currentSequence,
    locale,
  )
  const followedCharacter = resolveFollowedCharacter(entities, followMode)

  return {
    id: presence.entityId,
    tierId,
    locationId: loc.slug,
    characterSlug: ownerCharacter.slug,
    location: loc,
    overviewX: 50,
    overviewY: (tierId ? tierOverviewY[tierId] : undefined) ?? 46,
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
      !perspectiveIsReader && knowledge.hasBeliefOnly ? messages.activeSuspicion : undefined,
    knowledgeState: resolveKnowledgeState(presence, knowledge),
    sourceLabel: resolveSourceLabel(knowledge, locale),
    sinceLabel: presence.fromEventId
      ? messages.sinceEvent(presence.fromEventId)
      : messages.unknownEvent,
    positionColor: temporalVisual.color,
    tierLabel: tierId ? tierLabelFor(tierId, locale) : messages.outsideTier,
    locationLabel: loc.name || messages.unknownPosition,
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
  locale: Locale = DEFAULT_LOCALE,
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
  const messages = messagesFor(locale).map
  const name = displayName(character.canonicalName, locale)

  return {
    id: presence.entityId,
    x: x / 10,
    y: y / 6,
    body: name,
    consciousness: name,
    appearance: name,
    perceivedIdentity: messages.futureIdentity(name, next.chapterNumber),
    knowledgeState: 'confirmed',
    positionColor: '#d598ff',
    tierLabel: tierId ? tierLabelFor(tierId, locale) : messages.outsideTier,
    locationLabel: loc?.name || messages.unknownFuturePosition,
    temporalLabel: messages.parallelFuture,
    temporalDetail: messages.positionInChapter(next.chapterNumber),
    tierId,
    locationId: loc?.slug,
    characterSlug: character.slug,
    location: loc,
    overviewX: 50,
    overviewY: (tierId ? tierOverviewY[tierId] : undefined) ?? 46,
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
export function packMarkersForZoom<T extends MapMarker>(
  markers: T[],
  zoom: ZoomLevel,
  locale: Locale = DEFAULT_LOCALE,
): T[] {
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
      // Every local marker states what its position in the room is worth, so a
      // fixture canon named and a point the map had to invent never read alike.
      const spotLabel = spotNoteFor(spot, locale)
      if (spot?.exact) {
        // Canon names this fixture for this passenger, so the marker sits on it
        // rather than being fanned out with the rest of the room.
        return { ...marker, x: spot.x, y: spot.y, spotLabel }
      }
      if (spot) {
        // Everyone the room catches by default shares one corner, so they do
        // have to fan out — the guard side of a cell holds a whole watch.
        const peers = markers
          .filter((peer) => !spotAnchorFor(peer)?.exact && peer.locationId === marker.locationId)
          .map((peer) => peer.id)
          .sort()
        const seat = Math.max(0, peers.indexOf(marker.id))
        return {
          ...marker,
          x: spot.x + (seat % 3) * 4,
          y: spot.y + Math.floor(seat / 3) * 5,
          spotLabel,
        }
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
        // A room anchor answers which room, never where in it.
        return {
          ...marker,
          x: anchor.x + ((seat % roomColumns) - (roomColumns - 1) / 2) * 5,
          y: anchor.y + (Math.floor(seat / roomColumns) - (roomRows - 1) / 2) * 5,
          spotLabel,
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
        spotLabel,
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

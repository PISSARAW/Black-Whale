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
import type { BeyondLineageStatus } from '$lib/beyondLineage'
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
  beyondLineage?: BeyondLineageStatus
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
 * Location ids to SVG coordinates, per deck, in the shared `0 0 1000 600`
 * viewBox of the tier maps.
 *
 * Generated from `data/ship/blueprint.json`, like the deck maps themselves: a
 * location's anchor is the centroid of the space the reconstruction gives it,
 * so a marker lands in the room the map draws rather than near it. Where one
 * location is split across two spaces — the lifeboat deck has a port half and
 * a starboard half — the larger half wins, because a marker has to be
 * somewhere. Each deck also anchors itself, for a passenger the archive places
 * on the tier and nowhere finer.
 *
 * `small` marks a room too tight for the wide fan-out: co-located markers in a
 * prince's room close up rather than spilling out into the court around it.
 */
type TierAnchor = { x: number; y: number; small?: true }

const locationCoordinates: Record<string, Record<string, TierAnchor>> = {
  'tier-1': {
    'tier-1': { x: 523.9, y: 284.8 },
    'tier-1-banquet-hall': { x: 475.0, y: 255.0 },
    'tier-1-king-living-quarters': { x: 475.0, y: 160.0 },
    'tier-1-lifeboats': { x: 135.0, y: 300.0, small: true },
    'tier-1-princes-burial-chamber': { x: 475.0, y: 83.4, small: true },
    'tier-1-royal-residential-sector': { x: 530.0, y: 385.0 },
    'tier-1-royal-residential-sector-room-1001': { x: 558.6, y: 322.1, small: true },
    'tier-1-royal-residential-sector-room-1002': { x: 501.4, y: 322.1, small: true },
    'tier-1-royal-residential-sector-room-1003': { x: 558.6, y: 341.4, small: true },
    'tier-1-royal-residential-sector-room-1004': { x: 501.4, y: 341.4, small: true },
    'tier-1-royal-residential-sector-room-1005': { x: 558.6, y: 360.7, small: true },
    'tier-1-royal-residential-sector-room-1006': { x: 501.4, y: 360.7, small: true },
    'tier-1-royal-residential-sector-room-1007': { x: 558.6, y: 380.0, small: true },
    'tier-1-royal-residential-sector-room-1008': { x: 501.4, y: 380.0, small: true },
    'tier-1-royal-residential-sector-room-1009': { x: 558.6, y: 399.3, small: true },
    'tier-1-royal-residential-sector-room-1010': { x: 501.4, y: 399.3, small: true },
    'tier-1-royal-residential-sector-room-1011': { x: 558.6, y: 418.6, small: true },
    'tier-1-royal-residential-sector-room-1012': { x: 501.4, y: 418.6, small: true },
    'tier-1-royal-residential-sector-room-1013': { x: 558.6, y: 437.9, small: true },
    'tier-1-royal-residential-sector-room-1014': { x: 501.4, y: 437.9, small: true },
    'tier-1-vvip-living-quarters': { x: 292.9, y: 385.0, small: true },
  },
  /**
   * The garrison deck of the tier 1 liner. Its rooms are drawn on
   * `tier-1-b.svelte`, so its markers are filed here and not with the royal
   * deck: on the royal deck those coordinates are now the floor these blocks
   * left behind, and a queen standing on a floor she vacated is exactly the
   * kind of wrong this table exists to prevent.
   */
  'tier-1-b': {
    'tier-1-b': { x: 690.0, y: 300.0 },
    'tier-1-soldiers-living-quarters': { x: 652.5, y: 385.0 },
    'tier-1-supreme-court': { x: 790.0, y: 410.0 },
    'tier-1-vip-jail': { x: 790.0, y: 320.0, small: true },
    'tier-1-vvip-prison-beyond': { x: 790.0, y: 270.0, small: true },
  },
  /** The guest deck of the tier 1 liner, drawn on `tier-1-c.svelte`. */
  'tier-1-c': {
    'tier-1-c': { x: 425.0, y: 385.0 },
    'tier-1-queens-living-quarters': { x: 422.5, y: 385.0, small: true },
    'tier-1-queens-living-quarters-room-01': { x: 402.0, y: 328.8, small: true },
    'tier-1-queens-living-quarters-room-02': { x: 443.0, y: 328.8, small: true },
    'tier-1-queens-living-quarters-room-03': { x: 402.0, y: 366.3, small: true },
    'tier-1-queens-living-quarters-room-04': { x: 443.0, y: 366.3, small: true },
    'tier-1-queens-living-quarters-room-05': { x: 402.0, y: 403.8, small: true },
    'tier-1-queens-living-quarters-room-06': { x: 443.0, y: 403.8, small: true },
    'tier-1-queens-living-quarters-room-07': { x: 402.0, y: 441.3, small: true },
    'tier-1-queens-living-quarters-room-08': { x: 443.0, y: 441.3, small: true },
    'tier-1-vip-casino': { x: 360.0, y: 385.0 },
  },
  'tier-2': {
    'tier-2': { x: 517.0, y: 394.2 },
    'tier-2-bulkhead': { x: 500.0, y: 497.5, small: true },
    'tier-2-heilly-secret-hideout': { x: 512.5, y: 225.0 },
    'tier-2-ministry-of-justice': { x: 610.0, y: 385.0 },
    'tier-2-screening-room': { x: 375.0, y: 385.0 },
    'tier-2-vip-witness-protection-area': { x: 752.5, y: 385.0 },
  },
  'tier-3': {
    'tier-3': { x: 482.8, y: 285.4 },
    'tier-3-central-courthouse': { x: 550.0, y: 385.0 },
    'tier-3-central-hospital': { x: 715.0, y: 295.0 },
    'tier-3-central-police-station': { x: 450.0, y: 365.0 },
    'tier-3-cineplex': { x: 715.0, y: 160.0 },
    'tier-3-heilly-family-office': { x: 715.0, y: 420.0 },
    'tier-3-observation-deck': { x: 75.1, y: 295.7 },
    'tier-3-residential-units': { x: 450.0, y: 450.0, small: true },
  },
  /**
   * The first-class deck of tier 3, drawn on `tier-3-b.svelte`.
   *
   * The cabins hang above the civic blocks on the cross-section rather than
   * beside them, so they are a floor of their own now and their markers are
   * filed with it: on the civic deck those coordinates are the floor the block
   * left behind.
   */
  'tier-3-b': {
    'tier-3-b': { x: 482.8, y: 285.4 },
    'tier-3-residential-first-class': { x: 274.3, y: 173.6 },
    'tier-3-residential-room-3101': { x: 210.0, y: 195.0, small: true },
  },
  /** The ordinary cabins of tier 3, the top floor of the tier: `tier-3-c.svelte`. */
  'tier-3-c': {
    'tier-3-c': { x: 482.8, y: 285.4 },
    'tier-3-residential-standard': { x: 270.0, y: 370.0 },
  },
  'tier-4': {
    'tier-4': { x: 481.2, y: 336.1 },
    'tier-4-central-passage': { x: 407.5, y: 250.0, small: true },
    'tier-4-recycling-sewage-facilities': { x: 485.0, y: 522.5 },
    'tier-4-royal-army-conference-room': { x: 575.0, y: 155.0 },
    'tier-4-xi-yu-family-office': { x: 400.0, y: 300.0 },
  },
  /**
   * The upper floor of tier 4, drawn on `tier-4-b.svelte`: the Ei-I office and
   * the passage that reaches it. The cross-section hangs that one block above
   * the passage Kuroro's group walks, and nothing else with it.
   */
  'tier-4-b': {
    'tier-4-b': { x: 481.2, y: 336.1 },
    'tier-4-ei-i-family-office': { x: 567.4, y: 300.0 },
  },
  'tier-5': {
    'tier-5': { x: 451.6, y: 254.0 },
    'tier-4-recycling-sewage-facilities': { x: 450.0, y: 125.0 },
    'tier-5-central-dining-hall': { x: 585.0, y: 375.0 },
    'tier-5-hangar-entrance': { x: 500.0, y: 285.0 },
    'tier-5-cha-r-family-office': { x: 460.0, y: 375.0 },
    'tier-5-medical-clinic': { x: 685.0, y: 375.0 },
    'tier-5-warehouse': { x: 560.0, y: 240.0 },
  },
  /**
   * The cabin deck of tier 5, drawn on `tier-5-b.svelte`.
   *
   * The cross-section hangs the fifth-class cabins over the dining hall, the
   * hangar door and the Sha-A office, so Machi is a floor above Franklin,
   * Feitan and the three in the office rather than across the deck from them.
   */
  'tier-5-b': {
    'tier-5-b': { x: 451.6, y: 254.0 },
    'tier-5-area-37564': { x: 270.0, y: 355.0, small: true },
    'tier-5-standard-cabins': { x: 270.0, y: 252.5 },
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

  // The prince apartments below share `local/prince-apartment.svelte`: 800 × 953,
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
    occupants: { 'prince-benjamin': { x: 75, y: 63.29 } },
  },
  // Camilla holds court from the massage table, ch. 413.
  'tier-1-royal-residential-sector-room-1002': {
    occupants: { 'prince-camilla': { x: 26.88, y: 49.78 } },
  },
  // Zhang Lei works the ZhangCoins from the low table, ch. 374 to 404.
  'tier-1-royal-residential-sector-room-1003': {
    occupants: { 'prince-zhanglei': { x: 48.75, y: 56.21 } },
  },
  // Tserriednich drills Zetsu on his training floor; Theta is laid on a bed
  // after his Nen beast marks her in ch. 385, with Salkov at her side.
  'tier-1-royal-residential-sector-room-1004': {
    occupants: {
      'prince-tserriednich': { x: 74.38, y: 63.29 },
      theta: { x: 15, y: 85.15 },
      // Salkov is at her side through the scene; the panels frame the two of
      // them, not the corner of the room they are in.
      salkov: { x: 22, y: 85.15, inferred: true },
    },
  },
  // Tyson preaches from her seat, her disciples ranged in front, ch. 375.
  'tier-1-royal-residential-sector-room-1006': {
    occupants: { 'prince-tyson': { x: 28.13, y: 49.78 } },
  },
  // Luzurus does not get off this couch between ch. 362 and ch. 414.
  'tier-1-royal-residential-sector-room-1007': {
    occupants: { 'prince-luzurus': { x: 29.38, y: 65.21 } },
  },
  // Salé-salé holds his permanent party from the bed, ch. 362 to his murder.
  'tier-1-royal-residential-sector-room-1008': {
    occupants: { 'prince-salesale': { x: 15, y: 85.15 } },
  },
  // Kacho cries over the photos of her sister in bed, ch. 382, and it is the bed
  // Silent Majority comes to.
  'tier-1-royal-residential-sector-room-1010': {
    occupants: { 'prince-kacho': { x: 15, y: 85.15 } },
  },
  // Ch. 400 puts both twins in Fugetsu's bed, so they lie side by side on it:
  // the same fixture, offset by half its width rather than stacked.
  'tier-1-royal-residential-sector-room-1011': {
    occupants: {
      'prince-fugetsu': { x: 12.5, y: 85.15 },
      'prince-kacho': { x: 18, y: 85.15 },
    },
  },
  // Momoze is asleep in her bed in ch. 361, which is where Tuffdy kills her.
  'tier-1-royal-residential-sector-room-1012': {
    occupants: { 'prince-momoze': { x: 15, y: 85.15 } },
  },
  // Hanzo leaves his body on the bed while his Nen double hunts Tuffdy, ch. 372,
  // and climbs back into it there in ch. 375.
  'tier-1-royal-residential-sector-room-1013': {
    occupants: { hanzo: { x: 15, y: 85.15 } },
  },
  // 1014 is the room the arc stages most often, so it carries the most spots.
  // Kurapika stands at the front of the Nen class facing the students, who keep
  // the centred grid above him; the guarded side of the room — cradle, queen,
  // her two bodyguards — sits between the class and the master bedroom. Two
  // bodies never leave the places they fell in: Woody on the bathroom floor
  // (ch. 359) and Vincent by the entrance (ch. 364).
  'tier-1-royal-residential-sector-room-1014': {
    occupants: {
      kurapika: { x: 50, y: 72.41 },
      // Oito swapped the babies, so the cradle holds whichever one the archive
      // currently believes is in it.
      'prince-woble': { x: 75, y: 67.15 },
      'oito-nephew-fake-woble': { x: 75, y: 67.15 },
      'queen-oito': { x: 69, y: 67.15 },
      // The two bodyguards keep the protected side of the room. Canon says
      // that much and never places them against a fixture.
      bill: { x: 69, y: 61.1, inferred: true },
      shimanu: { x: 81, y: 61.1, inferred: true },
      longhi: { x: 56.25, y: 87.07 },
      woody: { x: 81.25, y: 87.07 },
      vincent: { x: 50, y: 15.06 },
      // Silent Majority drops these two on the classroom floor itself, in front
      // of the students it is hiding among — ch. 369 and ch. 370.
      barrigen: { x: 40, y: 62.13 },
      myuhan: { x: 60, y: 62.13 },
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
  // `local/banquet-hall.svelte`, 1000 × 320, six pixels to the metre with the
  // vestibule's fore wall at the origin — the asset draws the hall the ch. 349
  // deck plan cuts, 157.5 m long and 24.5 m deep, and the same grid of tables
  // the blueprint lays: four rows on y = -24.5, -19.5, -12 and -7, eighteen
  // columns from x = -58 at a six-metre pitch, and the throne's axis left open
  // between the second row and the third.
  //
  // Only the throne is depicted: the inaugural banquet of ch. 359 seats Nasubi
  // on it, and the hall holds him nowhere else. Everyone else is at a table the
  // chapter shows but the archive cannot number, so they take one table each and
  // say so — the twins share theirs because they leave together, and Oito holds
  // the child. Those are readings of the scene, not copies of it.
  'tier-1-banquet-hall': {
    occupants: {
      // The dais, thirteen metres in front of the stage.
      'nasubi-hui-guo-rou': { x: 13.75, y: 66.09 },
      'prince-benjamin': { x: 63.7, y: 49.69, inferred: true },
      // Ch. 362 has Tserriednich and Tubeppa strike their alliance here, so
      // they share a table.
      'prince-tserriednich': { x: 34.1, y: 73.13, inferred: true },
      'prince-tubeppa': { x: 35.7, y: 73.13, inferred: true },
      'prince-camilla': { x: 63.7, y: 73.13, inferred: true },
      'prince-zhanglei': { x: 70.9, y: 73.13, inferred: true },
      // Halkenburg keeps a corner until he crosses to the throne in ch. 361 to
      // tell his father he withdraws. The corner is the habitual place; the
      // crossing is the freeze-frame the anchors deliberately do not chase.
      'prince-halkenburg': { x: 81.7, y: 49.69, inferred: true },
      'prince-kacho': { x: 23.3, y: 59.06, inferred: true },
      'prince-fugetsu': { x: 24.9, y: 59.06, inferred: true },
      'queen-oito': { x: 48.5, y: 73.13, inferred: true },
      'oito-nephew-fake-woble': { x: 50.1, y: 73.13, inferred: true },
      // Momoze is in a corner, and the catalogue's own biographies seat her
      // beside Marayam, who stays with their mother Sevanti: one corner table
      // for the three of them. Which corner is not depicted.
      'sevanti-hui-guo-rou': { x: 19.7, y: 49.69, inferred: true },
      'prince-marayam': { x: 20.5, y: 49.69, inferred: true },
      'prince-momoze': { x: 21.3, y: 49.69, inferred: true },
    },
    // The hall seats the whole ceremony: anyone the chapter does not single out
    // belongs among the tables, not on the king's dais.
    fallback: { x: 52.9, y: 59.06, inferred: true },
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
  // `local/casino.svelte`, 1000 × 400, sixteen pixels to the metre with the
  // room turned a quarter turn: fore to the left, port at the top. The gaming
  // floor is two columns of nine tables, on x = -53.5 and -44.5, from z = 8
  // aft at a 5.5 m pitch — the same tables the blueprint lays.
  //
  // Hisoka plays the unconventional variants in ch. 405. Which table is not
  // depicted, so he takes one on the port column, mid-room.
  'tier-1-vip-casino': {
    occupants: { hisoka: { x: 50.4, y: 34.5, inferred: true } },
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

/**
 * Where each deck sits in the overview, as a percentage of its height; the
 * label is built from the catalogue.
 *
 * The overview is the ship in longitudinal section now, so these are the mid
 * height of each deck in that drawing rather than five numbers eyeballed
 * against five hand-drawn slabs — a marker on tier 4 lands between tier 4's
 * floor and its ceiling. `scripts/generate-section-map.py` prints them when it
 * runs; `sectionMap.test.ts` fails if they drift from what it draws.
 */
export const tierOverviewY: Record<string, number> = {
  'tier-1': 32.3,
  'tier-1-b': 28.8,
  'tier-1-c': 27.4,
  'tier-2': 45.1,
  'tier-3': 58.2,
  'tier-3-b': 54.9,
  'tier-3-c': 53.5,
  'tier-4': 71.1,
  'tier-4-b': 68.0,
  'tier-5': 83.8,
  'tier-5-b': 78.7,
}

/**
 * How tall each deck is drawn in the overview, as a percentage of its height.
 *
 * A deck used to be a hand-drawn slab a seventh of the picture tall, and a
 * crowd on it could fan out freely. In section a deck is its own five metres
 * and no more, so a fan-out that ignores this puts tier 1's hundred passengers
 * across tiers 2 and 3 as well — people standing in a deck they are not on,
 * which is the one thing this map exists to answer.
 */
/**
 * How far each deck reaches fore and aft in the overview, as percentages of the
 * width.
 *
 * The whale tapers, so no two decks are the same length: tier 5 stops at 69 %
 * where tier 3 runs to 79 %, and the liner's guest deck does not begin until
 * 28 %. A crowd fanned out across one fixed band therefore hung people off both
 * ends of the ship — Tajao, in the Cha-R office on tier 5, was drawn swimming
 * astern of it.
 *
 * `scripts/generate-section-map.py` prints these when it runs, and
 * `sectionMap.test.ts` fails if they drift from the hull it draws.
 */
export const tierOverviewSpan: Record<string, [number, number]> = {
  'tier-1': [12.8, 72.9],
  'tier-1-b': [28.8, 72.9],
  'tier-1-c': [28.8, 63.5],
  'tier-2': [8.6, 77.1],
  'tier-3': [4.4, 81.2],
  'tier-3-b': [4.4, 81.2],
  'tier-3-c': [4.4, 81.2],
  'tier-4': [5, 80.5],
  'tier-4-b': [5, 80.5],
  'tier-5': [7.7, 70.7],
  'tier-5-b': [7.7, 70.7],
}

export const tierOverviewBand: Record<string, number> = {
  'tier-1': 2,
  'tier-1-b': 1.2,
  'tier-1-c': 1.2,
  'tier-2': 2,
  'tier-3': 2.4,
  'tier-3-b': 1.2,
  'tier-3-c': 1.2,
  'tier-4': 1.8,
  'tier-4-b': 1.2,
  'tier-5': 1.8,
  'tier-5-b': 1.8,
}

/**
 * A deck of the tier 1 liner is still tier 1 to a reader: `tier-1-c` labels as
 * Tier 1, not as Tier 1-c. The split is geometry, and the badge on a marker
 * answers which tier someone is on.
 */
export function tierLabelFor(tierId: string, locale: Locale = DEFAULT_LOCALE): string {
  const number = tierId.match(/^tier-([1-5])/)?.[1] ?? tierId.replace('tier-', '')
  return messagesFor(locale).ship.tierLabel(number)
}

/**
 * Which deck map draws a room, read off the table that positions it there.
 *
 * Only a deck that shares its tier's prefix can be told apart this way, which
 * is the only case there is: no other tier of the ship has more than one deck.
 */
/** The anchor a deck holds for one room, or `null` where it holds none. */
export function anchorFor(deckId: string, slug: string): TierAnchor | null {
  return locationCoordinates[deckId]?.[slug] ?? null
}

function deckDrawing(slug: string): string | null {
  for (const [deckId, anchors] of Object.entries(locationCoordinates)) {
    if (slug in anchors) return deckId
  }
  return null
}

export function resolveTierSlug(
  location: Location | null | undefined,
  byId: Map<string, Location>,
): string | null {
  let current = location
  let depth = 0

  // The deck that draws the room comes first. Tier 1 is a liner of three decks
  // and the slug of every room on it still begins `tier-1-`, so the prefix
  // below would file the casino with the royal deck — which stopped drawing it
  // when the casino moved two decks up.
  const drawnOn = location?.slug ? deckDrawing(location.slug) : null
  if (drawnOn) return drawnOn

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
  // Longest key first, so a room beats the deck it stands on: exact id, then
  // the id it hangs under — a cell answers to its block, a ward to its deck —
  // and last the old suffix match, for a slug that names a room without its
  // deck in front of it.
  const coordinateKey = Object.keys(tierCoordinates)
    .sort((left, right) => right.length - left.length)
    .find(
      (key) =>
        locationSlug === key ||
        locationSlug.startsWith(`${key}-`) ||
        locationSlug.endsWith(`-${key}`),
    )
  const anchor = coordinateKey ? tierCoordinates[coordinateKey] : undefined
  if (anchor) return { x: anchor.x, y: anchor.y, isSmallRoom: anchor.small === true }

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
    beyondLineage: ownerCharacter.beyondLineage,
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
    beyondLineage: character.beyondLineage,
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
    // Wide rather than tall: the section gives a deck the length and the height
    // it really has, so a crowd spreads along that deck and is packed tighter
    // down until it fits between its own floor and its own ceiling. Both bounds
    // are the deck's own — a fixed band put tier 5 in the water astern.
    const columns = Math.min(24, group.length)
    const rows = Math.ceil(group.length / columns)
    const [fore, aft] = tierOverviewSpan[marker.tierId ?? ''] ?? [16, 84]
    const inset = (aft - fore) * 0.06
    const band = tierOverviewBand[marker.tierId ?? ''] ?? 4
    const pitch = Math.min(1.8, band / Math.max(rows, 1))
    return {
      ...marker,
      x: fore + inset + ((index % columns) + 0.5) * ((aft - fore - 2 * inset) / columns),
      y: marker.overviewY + (Math.floor(index / columns) - (rows - 1) / 2) * pitch,
    }
  })
}

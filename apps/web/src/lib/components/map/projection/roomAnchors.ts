import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'

import type { MapMarker } from './types'

/**
 * Room anchors inside a local map, as percentages of the local SVG box.
 *
 * A tier map draws a block as one region, so `locationCoordinates` stops at the
 * block. Zoomed into the block the rooms are drawn individually, and a marker
 * that ignores them lands in the corridor whatever room the archive assigned.
 * A slug listed here is placed in its own room; anything else keeps the centred
 * grid, which is still the right answer for a local map with no rooms drawn.
 */
export const localRoomAnchors: Record<string, { x: number; y: number }> = Object.fromEntries(
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

  // Rooms 1001–1010 use `local/prince-apartment.svelte`. Rooms 1011–1014 use
  // the distinct ch. 368 cutaway in `local/junior-prince-apartment.svelte`;
  // their coordinates below therefore follow that second drawing. The shared
  // plan draws a bed at (20, 550)
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
      'prince-fugetsu': { x: 69, y: 35 },
      'prince-kacho': { x: 75, y: 35 },
    },
  },
  // Momoze is asleep in her bed in ch. 361, which is where Tuffdy kills her.
  'tier-1-royal-residential-sector-room-1012': {
    occupants: { 'prince-momoze': { x: 21, y: 35 } },
  },
  // Hanzo leaves his body on the bed while his Nen double hunts Tuffdy, ch. 372,
  // and climbs back into it there in ch. 375.
  'tier-1-royal-residential-sector-room-1013': {
    occupants: { hanzo: { x: 78, y: 72 } },
  },
  // 1014 is the room the arc stages most often, so it carries the most spots.
  // Kurapika stands at the front of the Nen class facing the students, who keep
  // the centred grid above him; the guarded side of the room — cradle, queen,
  // her two bodyguards — sits between the class and the master bedroom. Two
  // bodies never leave the places they fell in: Woody on the bathroom floor
  // (ch. 359) and Vincent by the entrance (ch. 364).
  'tier-1-royal-residential-sector-room-1014': {
    occupants: {
      kurapika: { x: 69, y: 39 },
      // Oito swapped the babies, so the cradle holds whichever one the archive
      // currently believes is in it.
      'prince-woble': { x: 29, y: 27 },
      'oito-nephew-fake-woble': { x: 29, y: 27 },
      'queen-oito': { x: 37, y: 39 },
      // The two bodyguards keep the protected side of the room. Canon says
      // that much and never places them against a fixture.
      bill: { x: 45, y: 43, inferred: true },
      shimanu: { x: 55, y: 43, inferred: true },
      longhi: { x: 37, y: 78 },
      woody: { x: 72, y: 78 },
      vincent: { x: 50, y: 83 },
      // Silent Majority drops these two on the classroom floor itself, in front
      // of the students it is hiding among — ch. 369 and ch. 370.
      barrigen: { x: 64, y: 48 },
      myuhan: { x: 76, y: 48 },
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
 * Positions drawn by one specific event, before the room's habitual positions.
 *
 * Chapter 416 moves the same military group through two apartments in a few
 * minutes. A room-wide anchor cannot represent that: Benjamin is neither at his
 * command console nor on Tserriednich's training spot. These tables reconstruct
 * the staging on the shared apartment plan. In the final event Benjamin and
 * Tserriednich share a horizontal sight line, with the soldiers behind Benjamin,
 * so the map shows the point-blank shot as a confrontation rather than a crowd.
 */
const localEventSpotAnchors: Record<string, Record<string, Record<string, Spot>>> = {
  'Benjamin confronts Camilla under special martial law': {
    'tier-1-vip-jail': {
      'prince-camilla': { x: 35, y: 42 },
      'prince-benjamin': { x: 35, y: 53 },
      furykov: { x: 48, y: 53 },
      butch: { x: 55, y: 53 },
      mozbe: { x: 42, y: 41 },
      fukataki: { x: 24, y: 41 },
    },
  },
  'Moswana sacrifices herself and curses Benjamin': {
    'tier-1-vip-jail': {
      'prince-camilla': { x: 27, y: 33 },
      moswana: { x: 35, y: 49 },
      'prince-benjamin': { x: 35, y: 54 },
      furykov: { x: 48, y: 54 },
      butch: { x: 55, y: 54 },
      mozbe: { x: 42, y: 41 },
      fukataki: { x: 24, y: 41 },
    },
  },
  'Tserriednich prepares Salkov to witness his false death': {
    'tier-1-royal-residential-sector-room-1004': {
      'prince-tserriednich': { x: 74, y: 63.29 },
      salkov: { x: 61, y: 63.29 },
      danjin: { x: 50, y: 38 },
    },
  },
  'Benjamin breaches room 1004 and shoots Tserriednich': {
    'tier-1-royal-residential-sector-room-1004': {
      // Same axis, opposite sides: the shot is face-to-face.
      'prince-benjamin': { x: 61, y: 63.29 },
      'prince-tserriednich': { x: 70, y: 63.29 },
      furykov: { x: 52, y: 57 },
      butch: { x: 52, y: 69 },
      salkov: { x: 78, y: 55 },
      danjin: { x: 50, y: 38 },
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
/** The staging one named event imposes on this room, if it stages one at all. */
function eventSpotFor(marker: MapMarker): Spot | undefined {
  if (!marker.currentEventTitle) return undefined
  return localEventSpotAnchors[marker.currentEventTitle]?.[marker.locationId ?? '']?.[
    marker.characterSlug ?? ''
  ]
}

export function spotAnchorFor(marker: MapMarker): (Spot & { exact: boolean }) | null {
  const eventSpot = eventSpotFor(marker)
  if (eventSpot) return { ...eventSpot, exact: true }

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
export function spotNoteFor(
  spot: { inferred?: true } | null,
  locale: Locale = DEFAULT_LOCALE,
): string | undefined {
  const m = messagesFor(locale).map
  if (!spot) return m.roomConfirmed
  return spot.inferred ? m.spotInferred : undefined
}

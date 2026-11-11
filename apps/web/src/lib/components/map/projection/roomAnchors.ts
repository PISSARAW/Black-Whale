import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'

import type { MapMarker } from './types'
import { banquetSpotAnchors } from './banquetPlan'
import { salonSpotAnchors } from './royalSalonPlan'
import { prisonSpotAnchors } from './prisonPlan'
import { diningHallSpotAnchors } from './diningHallPlan'
import { burialSpotAnchors } from './burialChamberPlan'
import { queenUnmaSpotAnchors } from './queenUnmaPlan'
import { zhangLeiSpotAnchors } from './zhangLeiPlan'
import { benjaminSpotAnchors } from './benjaminRoomPlan'
import {
  camillaSpotAnchors,
  camillaLivingSpotAnchors,
  camillaDiningSpotAnchors,
  camillaEntranceSpotAnchors,
} from './camillaPlan'
import { princesSpotAnchors } from './princesPlan'
import { justiceSpotAnchors } from './justiceBureauPlan'
import { policeSpotAnchors } from './policeStationPlan'
import { cineplexSpotAnchors } from './cineplexPlan'
import { royalArmyConferenceSpotAnchors } from './royalArmyConferencePlan'
import { vvipRecreationSpotAnchors } from './vvipRecreationPlan'
import { supremeCourtSpotAnchors } from './supremeCourtPlan'
import { hangarEntranceSpotAnchors } from './hangarEntrancePlan'
import { screeningRoomSpotAnchors } from './screeningRoomPlan'
import { warehouseSpotAnchors } from './warehousePlan'

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
type Spot = { x: number; y: number; inferred?: boolean }

const localSpotAnchors: Record<string, { occupants: Record<string, Spot>; fallback?: Spot }> = {
  'tier-1-vvip-prison-beyond': prisonSpotAnchors,
  'tier-1-princes-quarters-gate': princesSpotAnchors,
  // `local/vip-detention.svelte`, 1000 × 600, contents offset by (50, 80).
  'tier-1-vip-jail': {
    // The first-class cell, the one a detained princess is held in.
    occupants: { 'prince-camilla': { x: 27, y: 33.33 } },
  },

  // The junior-apartment assets project the explicitly reconstructed walked plans.
  // Their metric placements are interpretations, not measured chapter-368 cutaways.
  // No fallback is declared: unplaced passengers keep the centred grid.

  // Benjamin takes his reports from the command post, ch. 363, 366 and 413.
  'tier-1-royal-residential-sector-room-1001': {
    occupants: { 'prince-benjamin': { x: 75, y: 63.29 } },
  },
  'tier-1-royal-residential-sector-room-1001-living': benjaminSpotAnchors,
  // Camilla holds court from the massage table, ch. 413; Have-Nots in salon, ch. 389; Duazul & Musse, ch. 366.
  'tier-1-royal-residential-sector-room-1002': camillaSpotAnchors,
  'tier-1-royal-residential-sector-room-1002-living': camillaLivingSpotAnchors,
  'tier-1-royal-residential-sector-room-1002-dining': camillaDiningSpotAnchors,
  'tier-1-royal-residential-sector-room-1002-entrance': camillaEntranceSpotAnchors,
  // Zhang Lei works the ZhangCoins from the low table, ch. 374 to 404; state dining audience, ch. 365–366.
  'tier-1-royal-residential-sector-room-1003': {
    occupants: { 'prince-zhanglei': { x: 48.75, y: 56.21 } },
  },
  'tier-1-royal-residential-sector-room-1003-dining': zhangLeiSpotAnchors,
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
  // The 1011 map follows the reconstructed walked layout; ch. 400 puts both twins on its bed:
  // the same fixture, offset by half its width rather than stacked.
  'tier-1-royal-residential-sector-room-1011': {
    occupants: {
      'prince-fugetsu': { x: 22.83, y: 81.25 },
      'prince-kacho': { x: 28.83, y: 81.25 },
    },
  },
  // Ch. 366 shows Momoze in bed; this anchor follows the reconstructed walked plan.
  'tier-1-royal-residential-sector-room-1012': {
    occupants: { 'prince-momoze': { x: 25.83, y: 80.88 } },
  },
  // Hanzo rests on an upper bunk, ch. 372; this follows the reconstructed walked layout,
  // and climbs back into it there in ch. 375.
  'tier-1-royal-residential-sector-room-1013': {
    occupants: { hanzo: { x: 12.08, y: 19.85 } },
  },
  // The 1014 projection uses the walked plan. Ch. 371 p. 4 shows Woble on Oito's
  // large bed; no separate cradle is established by that panel. Other positions
  // keep the classroom and private wing distinct, with guards explicitly inferred.
  'tier-1-royal-residential-sector-room-1014': {
    occupants: {
      kurapika: { x: 54.17, y: 47.43 },
      'prince-woble': { x: 25.83, y: 80.88 },
      'oito-nephew-fake-woble': { x: 25.83, y: 80.88 },
      'queen-oito': { x: 35.83, y: 78.68 },
      bill: { x: 52.08, y: 73.9, inferred: true },
      shimanu: { x: 58.33, y: 77.94, inferred: true },
      longhi: { x: 51.25, y: 79.41 },
      woody: { x: 86.25, y: 82.72 },
      vincent: { x: 50, y: 37.87 },
      barrigen: { x: 50.83, y: 55.51 },
      myuhan: { x: 58.33, y: 59.19 },
    },
  },

  // `local/justice-bureau.svelte`, 1000 × 700, contents offset by (60, 90).
  // Melody and Kaiser are questioned across the interrogation table in ch. 386
  'tier-2-ministry-of-justice': justiceSpotAnchors,
  // Witness protection is a room the bureau plan draws but the archive files as
  // its own location, so without an anchor everyone confined there landed in the
  // middle of the whole bureau. Fugetsu and Without You are the only occupants
  // and canon keeps them together, so the whole location shares the safe area.
  'tier-2-vip-witness-protection-area': {
    occupants: {},
    fallback: { x: 28, y: 67.86, inferred: true },
  },

  // The royal chair and the ch. 413 bier follow the same plan as the walk.
  'tier-1-king-living-quarters': salonSpotAnchors,
  // The shared banquet projection keeps the king on the drawn dais.
  'tier-1-banquet-hall': banquetSpotAnchors,
  // Grand VVIP recreation hall with double stairs and mezzanine (ch. 419).
  'tier-1-vvip-recreation-hall': vvipRecreationSpotAnchors,
  // Nasubi stands by Momoze's coffin in the secret rotunda (ch. 371).
  'tier-1-princes-burial-chamber-rotunda': burialSpotAnchors,
  // Queen Unma sits in her carved armchair in Room 01, ch. 403.
  'tier-1-queens-living-quarters': {
    occupants: {
      'unma-hui-guo-rou': { x: 22.19, y: 34.17 },
    },
  },
  'tier-1-queens-living-quarters-room-01': queenUnmaSpotAnchors,
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
  // The Supreme Court courtroom (ch. 349, 371, 376, 379).
  'tier-1-supreme-court': supremeCourtSpotAnchors,
  // The Tier 2 Screening Room & Grand Theatre (ch. 359).
  'tier-2-screening-room': screeningRoomSpotAnchors,
  // `local/cineplex.svelte`, 1000 × 800 (ch. 393).
  // Bonolenov watches from the seating island, wearing Hisoka's face, while Hisoka sits with popcorn.
  'tier-3-cineplex': cineplexSpotAnchors,
  'interior-cineplex': cineplexSpotAnchors,
  // The central police station atrium and safety desk (ch. 349, 378, 393).
  'tier-3-central-police-station': policeSpotAnchors,
  'tier-3-central-police-station-atrium': policeSpotAnchors,
  'tier-3-central-police-station-safety-section': {
    occupants: {},
    fallback: policeSpotAnchors.safetyDesk,
  },
  // The central dining hall follows the shared blueprint projection (ch. 371, 377, 379–380).
  'tier-5-central-dining-hall': diningHallSpotAnchors,
  // The Tier 5 hangar entrance and cargo blast gate (ch. 358, 377, 390).
  'tier-5-hangar-entrance': hangarEntranceSpotAnchors,
  // The Royal Army conference & briefing room (ch. 350, 380).
  'tier-4-royal-army-conference-room': royalArmyConferenceSpotAnchors,
  'tier-4-royal-army-conference-room-floor': royalArmyConferenceSpotAnchors,
  'interior-royal-army-conference': royalArmyConferenceSpotAnchors,
  // The Cha-R warehouse and crate rows (ch. 378–380).
  'tier-5-warehouse': warehouseSpotAnchors,
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
  spot: { inferred?: boolean } | null,
  locale: Locale = DEFAULT_LOCALE,
): string | undefined {
  const m = messagesFor(locale).map
  if (!spot) return m.roomConfirmed
  return spot.inferred ? m.spotInferred : undefined
}

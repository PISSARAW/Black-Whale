import type { Location } from '@black-whale/domain'

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

export const locationCoordinates: Record<string, Record<string, TierAnchor>> = {
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

/** The tier a location hangs under, walked up the parent chain it declares. */
function tierAbove(
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

export function resolveTierSlug(
  location: Location | null | undefined,
  byId: Map<string, Location>,
): string | null {
  // The deck that draws the room comes first. Tier 1 is a liner of three decks
  // and the slug of every room on it still begins `tier-1-`, so the prefix
  // walked above would file the casino with the royal deck — which stopped
  // drawing it when the casino moved two decks up.
  const drawnOn = location?.slug ? deckDrawing(location.slug) : null
  if (drawnOn) return drawnOn

  return tierAbove(location, byId)
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

export function getExactTierCoordinates(tierId: string, locationSlug: string) {
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

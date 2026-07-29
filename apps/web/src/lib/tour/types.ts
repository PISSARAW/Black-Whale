/**
 * The types of the walkable reconstruction of the Black Whale.
 *
 * The tour is a projection of `data/ship/blueprint.json`, which holds the ship
 * as metric geometry rather than as drawings. It is deliberately independent of
 * the deck maps under `$lib/assets/maps` and of the `/ship` page: those show
 * *who is where at a given event*, this one shows *what the ship is built like*.
 * Nothing here reads the timeline, and nothing here places a passenger.
 */

/** A point on a deck: `[x, z]` in metres, `+x` starboard and `+z` aft. */
export type Vec2 = readonly [number, number]

/** A closed simple polygon. The last point is not repeated. */
export type Polygon = Vec2[]

/**
 * How much of a piece of geometry the manga actually supports.
 *
 * - `panel` — a panel shows the room; its shape is read off that panel.
 * - `plan`  — it appears on the ship's deck cross-section, without an interior.
 * - `inferred` — nothing shows it. It exists so the deck is contiguous, and the
 *   tour marks it as such rather than passing it off as canon.
 */
export type Provenance = 'panel' | 'plan' | 'inferred'

export type SpaceCategory =
  | 'room'
  | 'corridor'
  | 'quarters'
  | 'residential'
  | 'public'
  | 'military'
  | 'administrative'
  | 'medical'
  | 'mafia'
  | 'prison'
  | 'ceremonial'
  | 'evacuation'
  | 'infrastructure'
  | 'storage'

/** How two spaces on different tiers are joined. */
export type LinkKind = 'stair' | 'lift' | 'bulkhead'

export interface Tier {
  id: string
  /** The matching `data/locations` id, so the tour and the catalogue agree. */
  locationId: string | null
  name: string
  nameFr: string
  /** Floor height above the keel, in metres. */
  elevation: number
  /** Default floor-to-ceiling height for spaces that do not override it. */
  ceiling: number
  provenance: Provenance
  source: string
  /** The outer hull at this tier, drawn as a reference outline. */
  hull: Polygon
}

export interface Space {
  id: string
  tierId: string
  /**
   * The catalogue location this space belongs to, or `null` when the tour
   * invented it. Several spaces may share one id: a lifeboat deck has a port
   * and a starboard half, and the catalogue holds a single record for both.
   */
  locationId: string | null
  name: string
  nameFr: string
  category: SpaceCategory
  provenance: Provenance
  source: string
  /** Floor-to-ceiling height, or `null` to take the tier's default. */
  ceiling: number | null
  footprint: Polygon
}

/** A vertical connection. Unlike a doorway it carries its own position. */
export interface Link {
  from: string
  to: string
  kind: LinkKind
  at: Vec2
  provenance: Provenance
  source: string
}

export interface Blueprint {
  meta: {
    unit: string
    scale: string
    origin: string
    note: string
  }
  tiers: Tier[]
  spaces: Space[]
  links: Link[]
}

/**
 * A gap in a shared wall. Doorways are not stored in the blueprint: two spaces
 * that share a stretch of wall are joined, and one that shares nothing is
 * sealed. That way a hand edit to a footprint cannot leave a door hanging in
 * mid-air, and an unreachable room is a validation failure rather than a
 * surprise at runtime.
 */
export interface Doorway {
  tierId: string
  a: string
  b: string
  /** The two ends of the opening, on the shared wall. */
  start: Vec2
  end: Vec2
  width: number
}

/** A stretch of wall left standing once the doorways are cut out of it. */
export interface WallSegment {
  spaceId: string
  start: Vec2
  end: Vec2
}

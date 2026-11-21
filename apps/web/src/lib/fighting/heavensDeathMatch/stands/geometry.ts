import {
  BALCONY,
  BACK_WALL_Z,
  HALL_HALF_WIDTH,
  PIT,
  RING,
  RING_Z,
  STAND_BACK,
  STAND_FRONT,
  TIERS,
  TIER_DEPTH,
  tierTop,
} from '../../heavensArenaLayout'

export { BALCONY, BACK_WALL_Z, STAND_BACK, STAND_FRONT }

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type SurfaceKind = 'ring' | 'pit' | 'tier' | 'stairs' | 'balcony'

export interface Surface {
  kind: SurfaceKind
  y: number
  /** Row index for tiers and stairs; absent elsewhere. */
  tier?: number
}

/** Aisles cut through the rows: the only walkable way between them. */
export const AISLES: readonly number[] = [-11.5, 0, 11.5]
export const AISLE_HALF_WIDTH = 0.6
export interface Rail {
  id: string
  z: number
  x: readonly [number, number]
  /** Top of the rail, in world height. */
  top: number
  /** Gaps the rail leaves open (aisle mouths). */
  gaps: readonly number[]
}

export const RAILS: readonly Rail[] = [
  { id: 'pit-barrier', z: STAND_FRONT + 0.1, x: [-23, 23], top: -PIT + 1.1, gaps: AISLES },
  { id: 'balcony-rail', z: BALCONY.zFront, x: [-22, 22], top: BALCONY.y + 1, gaps: [] },
]

export interface ExitSpec {
  id: string
  at: Vec3
}

export const EXITS: readonly ExitSpec[] = [
  { id: 'exit:back-left', at: { x: -11.5, y: tierTop(TIERS - 1), z: STAND_BACK } },
  { id: 'exit:back-right', at: { x: 11.5, y: tierTop(TIERS - 1), z: STAND_BACK } },
  { id: 'exit:side-left', at: { x: -23, y: -PIT, z: -6 } },
  { id: 'exit:side-right', at: { x: 23, y: -PIT, z: -6 } },
  { id: 'exit:balcony', at: { x: 0, y: BALCONY.y, z: BALCONY.zBack + 0.5 } },
]

export function inRing(x: number, z: number): boolean {
  return Math.abs(x) <= RING[0] / 2 && Math.abs(z - RING_Z) <= RING[1] / 2
}

export function inAisle(x: number): boolean {
  return AISLES.some((aisle) => Math.abs(x - aisle) <= AISLE_HALF_WIDTH)
}

/** Continuous row position: 0 at the front of the first row, TIERS at the back of the last. */
function rowPosition(z: number): number {
  return (STAND_FRONT - z) / TIER_DEPTH
}

function standSurface(x: number, z: number): Surface {
  const position = Math.min(TIERS - 1e-6, Math.max(0, rowPosition(z)))
  const tier = Math.floor(position)
  if (!inAisle(x)) return { kind: 'tier', y: tierTop(tier), tier }
  // Stairs climb evenly from the pit floor to the top of the last row.
  const y = -PIT + Math.min(TIERS, position + 1) * (tierTop(0) + PIT)
  return { kind: 'stairs', y: Math.min(y, tierTop(TIERS - 1)), tier }
}

/** The ground-level surface under a point, or null outside the hall. */
export function groundAt(x: number, z: number): Surface | null {
  if (Math.abs(x) > HALL_HALF_WIDTH || z < STAND_BACK - TIER_DEPTH / 2 || z > 12) return null
  if (inRing(x, z)) return { kind: 'ring', y: 0 }
  if (z > STAND_FRONT) return { kind: 'pit', y: -PIT }
  return standSurface(x, z)
}

export function inBalcony(x: number, z: number): boolean {
  return Math.abs(x) <= BALCONY.halfWidth && z <= BALCONY.zFront && z >= BALCONY.zBack
}

/** Every walkable level above a point, lowest first. */
export function surfacesAt(x: number, z: number): Surface[] {
  const ground = groundAt(x, z)
  const levels = ground ? [ground] : []
  if (inBalcony(x, z)) levels.push({ kind: 'balcony', y: BALCONY.y })
  return levels
}

/** The surface a falling body at `point` lands on: the highest one not above it. */
export function landingSurface(point: Vec3): Surface | null {
  const below = surfacesAt(point.x, point.z).filter((surface) => surface.y <= point.y + 0.05)
  return below.length ? below[below.length - 1] : null
}

function railGapAt(rail: Rail, x: number): boolean {
  return rail.gaps.some((gap) => Math.abs(x - gap) <= AISLE_HALF_WIDTH)
}

/** The rail a horizontal move crosses below its top, or null when the way is open. */
export function railBetween(from: Vec3, to: Vec3): Rail | null {
  for (const rail of RAILS) {
    const crosses = (from.z - rail.z) * (to.z - rail.z) < 0
    if (!crosses || Math.max(from.y, to.y) >= rail.top) continue
    const t = (rail.z - from.z) / (to.z - from.z)
    const x = from.x + (to.x - from.x) * t
    if (x >= rail.x[0] && x <= rail.x[1] && !railGapAt(rail, x)) return rail
  }
  return null
}

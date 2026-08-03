/**
 * Where in a room a body actually stands.
 *
 * The catalogue answers rooms, not metres: it says Kurapika is in 1014, and the
 * room is nine metres across. Something has to choose the spot, and the whole
 * question is what that something is allowed to be.
 *
 * It is a function of the character's own id, and of nothing else. Not of the
 * frame, not of the order the payload arrived in, not of a counter — because a
 * body that stood somewhere else on every load would be the walk asserting a
 * position it does not have, twice. Seeded on the id, the answer is the same
 * every time the same person is in the same room, which is the least the
 * reconstruction can promise about somebody it cannot place to the metre.
 *
 * The same seed answers the sector case. A leg that names the political ward
 * rather than a room resolves to several spaces; picking one by hash is a
 * declared shrug — the archive knows the ward, not the office — and it keeps
 * the body somewhere a visitor can find them twice.
 */
import { distanceToBoundary, interiorPoint, pointInPolygon } from '../geometry'
import type { Space, Vec2 } from '../types'

/** How far from a wall a standing body has to be, in metres. */
const CLEARANCE = 0.75

/**
 * A stable 32-bit hash of a string.
 *
 * The same FNV-1a `humanProfiles.ts` seeds a face with, and deliberately the
 * same: a character whose face is drawn from their id should stand at a spot
 * drawn from it too, so that everything the walk invents about one person comes
 * out of one number.
 */
export function seedOf(value: string): number {
  let hash = 2166136261
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

/**
 * Which of several spaces a body stands in, deterministically.
 *
 * Sorted by id first: the caller's order is the order a database answered in,
 * and a post that moved when a query plan changed would be no post at all.
 */
export function spaceAmong(spaces: readonly Space[], seed: string): Space | null {
  if (spaces.length === 0) return null
  const sorted = [...spaces].sort((left, right) => left.id.localeCompare(right.id))
  return sorted[seedOf(seed) % sorted.length]!
}

/**
 * Candidate spots in a room, in a fixed order: the grid `apparitionsOn` uses
 * for a shoal of fish, kept to the points a person could actually stand on.
 *
 * Offset rows, so a detail of four does not line up like a lattice, and the
 * clearance is what keeps a shoulder out of the steel.
 */
function standingSpots(space: Space): Vec2[] {
  const xs = space.footprint.map((corner) => corner[0])
  const zs = space.footprint.map((corner) => corner[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const across = 7
  const found: Vec2[] = []
  for (let row = 0; row < across; row++) {
    for (let column = 0; column < across; column++) {
      const u = (column + 0.5 + (row % 2) * 0.25) / across
      const v = (row + 0.5) / across
      const at: Vec2 = [minX + (maxX - minX) * u, minZ + (maxZ - minZ) * v]
      if (!pointInPolygon(at, space.footprint)) continue
      if (distanceToBoundary(at, space.footprint) < CLEARANCE) continue
      found.push(at)
    }
  }
  return found
}

/**
 * Where this body stands in this room, and which way it faces.
 *
 * Facing is inward, towards the middle of the room. Everyone the canon puts
 * aboard is standing a watch over a room or standing in one being watched, and
 * both of those face what is happening rather than the panelling. A body at the
 * exact middle has no inward to face and keeps `undefined`, which is the scene's
 * own way of saying "turn to whoever is looking".
 *
 * A room too narrow to hold anyone at the clearance still gets its interior
 * point rather than nobody: the room exists and the body is in it, and refusing
 * to draw them would be a stronger claim than the one being avoided.
 */
export function stationIn(space: Space, seed: string): { at: Vec2; heading?: number } {
  const spots = standingSpots(space)
  const middle = interiorPoint(space.footprint)
  const at = spots.length > 0 ? spots[seedOf(seed) % spots.length]! : middle
  const dx = middle[0] - at[0]
  const dz = middle[1] - at[1]
  if (Math.hypot(dx, dz) < 0.05) return { at }
  return { at, heading: Math.atan2(dx, dz) }
}

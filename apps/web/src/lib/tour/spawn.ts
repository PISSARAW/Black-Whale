import { roomColumnPositions } from './roomColumns'
import {
  blocksTheFloor,
  COLUMN_HALF_WIDTH,
  COLUMN_SPACING,
  interiorPoint,
  pointInPolygon,
  structureFootprint,
} from './geometry'
import type { Space, Structure, Vec2 } from './types'

const CINEPLEX_SCREEN = /^tier-3-cineplex-screen-\d$/

function cineplexArrival(space: Space): Vec2 | null {
  if (!CINEPLEX_SCREEN.test(space.id)) return null
  const xs = space.footprint.map(([x]) => x)
  return [(Math.min(...xs) + Math.max(...xs)) / 2 + 0.7, 17.72]
}

function columnCandidate(space: Space, point: Vec2): Vec2 {
  const clearance = COLUMN_HALF_WIDTH + 1.2
  for (const centre of roomColumnPositions(space)) {
    const dx = point[0] - centre[0]
    const dz = point[1] - centre[1]
    if (Math.abs(dx) > clearance || Math.abs(dz) > clearance) continue
    const shifted: Vec2 = [centre[0] + COLUMN_SPACING / 2, centre[1]]
    return pointInPolygon(shifted, space.footprint) ? shifted : [centre[0], centre[1] + clearance]
  }
  return point
}

function ringCandidate(candidate: Vec2, clear: (at: Vec2) => boolean): Vec2 {
  for (const distance of [2, 4, 6, 8, 12]) {
    for (let step = 0; step < 8; step++) {
      const angle = (step * Math.PI) / 4
      const at: Vec2 = [
        candidate[0] + Math.cos(angle) * distance,
        candidate[1] + Math.sin(angle) * distance,
      ]
      if (clear(at)) return at
    }
  }
  return candidate
}

/** Where the visitor stands when they arrive on a tier or jump to a space. */
export function spawnPoint(space: Space, structures: Structure[] = []): Vec2 {
  const authored = cineplexArrival(space)
  if (authored) return authored
  const point = interiorPoint(space.footprint)
  const candidate = columnCandidate(space, point)
  const solids = structures
    .filter((structure) => structure.spaceId === space.id && blocksTheFloor(structure))
    .map((structure) => structureFootprint(structure))
  const clear = (at: Vec2) =>
    pointInPolygon(at, space.footprint) && !solids.some((solid) => pointInPolygon(at, solid))
  if (clear(candidate)) return candidate
  return ringCandidate(candidate, clear)
}

/** Which way the camera faces on arrival: down the long axis, or toward the cinema screen. */
export function spawnFacing(space: Space, at: Vec2): number {
  if (CINEPLEX_SCREEN.test(space.id)) return Math.PI
  const xs = space.footprint.map((point) => point[0])
  const zs = space.footprint.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)

  let dx = 0
  let dz = 0
  if (maxX - minX >= maxZ - minZ) {
    dx = at[0] - minX > maxX - at[0] ? minX - at[0] : maxX - at[0]
  } else {
    dz = at[1] - minZ > maxZ - at[1] ? minZ - at[1] : maxZ - at[1]
  }
  return Math.atan2(-dx, -dz)
}

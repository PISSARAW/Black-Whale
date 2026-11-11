/**
 * Floor markings a manga panel actually shows.
 *
 * These are lines laid over the existing floor, never added furniture or an
 * invented change of level. The catalogue also records Tserriednich's polished
 * geometric training floor and Halkenburg's broad tiled reception room.
 */
import { clipSegment, plateSeams } from './geometry'
import type { Polygon, Space, Vec2 } from './types'

export type FloorPatternKind = 'geometric-inlay' | 'radial-deck' | 'floorboards' | 'tile' | 'plain'

export interface FloorPattern {
  kind: FloorPatternKind
  /** Inlay takes the gold architectural line; joints take the subdued seam line. */
  style: 'inlay' | 'joint'
  segments: [Vec2, Vec2][]
}

interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

function boundsOf(polygon: Polygon): Bounds {
  const xs = polygon.map(([x]) => x)
  const zs = polygon.map(([, z]) => z)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  }
}

/** The King's salon is read down a strict central axis, not as an undifferentiated lattice. */
function royalSalonInlay(polygon: Polygon): [Vec2, Vec2][] {
  const { minX, maxX, minZ, maxZ } = boundsOf(polygon)
  const segments: [Vec2, Vec2][] = []
  const x0 = minX + 0.72,
    x1 = maxX - 0.72,
    z0 = minZ + 0.72,
    z1 = maxZ - 0.72

  for (const inset of [0, 0.38]) {
    segments.push(
      [
        [x0 + inset, z0 + inset],
        [x1 - inset, z0 + inset],
      ],
      [
        [x1 - inset, z0 + inset],
        [x1 - inset, z1 - inset],
      ],
      [
        [x1 - inset, z1 - inset],
        [x0 + inset, z1 - inset],
      ],
      [
        [x0 + inset, z1 - inset],
        [x0 + inset, z0 + inset],
      ],
    )
  }

  for (const x of [-4.7, -1.35, 1.35, 4.7])
    segments.push([
      [x, z0],
      [x, z1],
    ])
  for (let z = z0 + 1.75; z < z1; z += 2.8)
    segments.push([
      [-4.7, z],
      [4.7, z],
    ])

  for (const side of [-1, 1]) {
    const centreX = side * 7.6
    for (let z = z0 + 1.6; z < z1 - 0.4; z += 3.5) {
      segments.push(
        [
          [centreX, z - 1.15],
          [centreX + 1.15, z],
        ],
        [
          [centreX + 1.15, z],
          [centreX, z + 1.15],
        ],
        [
          [centreX, z + 1.15],
          [centreX - 1.15, z],
        ],
        [
          [centreX - 1.15, z],
          [centreX, z - 1.15],
        ],
      )
    }
  }
  return segments
}

/** The sixteen hull panels meet the broad base at the cabin's centre. */
function radialDeck(polygon: Polygon): [Vec2, Vec2][] {
  const centre: Vec2 = [
    polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length,
    polygon.reduce((sum, [, z]) => sum + z, 0) / polygon.length,
  ]
  return polygon.map((corner) => [centre, corner])
}

/** Narrow boards running along the kitchen's long axis, with staggered ends. */
function floorboards(polygon: Polygon): [Vec2, Vec2][] {
  const { minX, maxX, minZ, maxZ } = boundsOf(polygon)
  const segments: [Vec2, Vec2][] = []
  const pitch = 0.32
  let row = 0
  for (let z = minZ + pitch; z < maxZ; z += pitch, row++) {
    segments.push(...clipSegment(polygon, [minX - 1, z], [maxX + 1, z]))
    const phase = row % 2 ? 1.2 : 0.2
    for (let x = minX + phase; x < maxX; x += 2) {
      segments.push(...clipSegment(polygon, [x, z - pitch], [x, z]))
    }
  }
  return segments
}

const tiles = (polygon: Polygon): [Vec2, Vec2][] => plateSeams(polygon, 0.8)

const modelledFloor = (space: Space) =>
  space.id === 'tier-1-royal-residential-sector-room-1002-living' ||
  ['interior-room-1003', 'interior-room-1004'].includes(space.tierId)

export function floorPatternOf(space: Space): FloorPattern | null {
  if (modelledFloor(space)) {
    return { kind: 'plain', style: 'joint', segments: [] }
  }
  if (space.id === 'tier-1-king-living-quarters-living') {
    return { kind: 'geometric-inlay', style: 'inlay', segments: royalSalonInlay(space.footprint) }
  }
  if (space.id === 'tier-1-lifeboats-port-pod-cabin') {
    return { kind: 'radial-deck', style: 'joint', segments: radialDeck(space.footprint) }
  }
  if (space.tierId === 'interior-room-1014') {
    return space.id.endsWith('-kitchen')
      ? { kind: 'floorboards', style: 'joint', segments: floorboards(space.footprint) }
      : { kind: 'tile', style: 'joint', segments: tiles(space.footprint) }
  }
  if (space.id === 'tier-2-heilly-secret-hideout-processing') {
    return { kind: 'tile', style: 'joint', segments: tiles(space.footprint) }
  }
  if (space.id === 'tier-1-royal-residential-sector-room-1009-living') {
    return { kind: 'tile', style: 'joint', segments: tiles(space.footprint) }
  }
  if (space.id === 'tier-5-central-dining-hall') {
    return { kind: 'tile', style: 'joint', segments: plateSeams(space.footprint, 1.75) }
  }
  return null
}

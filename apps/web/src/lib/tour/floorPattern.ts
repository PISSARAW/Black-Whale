/**
 * Floor markings a manga panel actually shows.
 *
 * These are lines laid over the existing floor, never added furniture or an
 * invented change of level. The catalogue also records Tserriednich's polished
 * geometric training floor and Halkenburg's broad tiled reception room.
 */
import { clipSegment, plateSeams } from './geometry'
import type { Polygon, Space, Vec2 } from './types'

export type FloorPatternKind = 'geometric-inlay' | 'radial-deck' | 'floorboards' | 'tile'

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

/** A clipped diagonal lattice within two inset borders. */
function geometricInlay(polygon: Polygon): [Vec2, Vec2][] {
  const { minX, maxX, minZ, maxZ } = boundsOf(polygon)
  const segments: [Vec2, Vec2][] = []
  const border = (inset: number) => {
    const x0 = minX + inset
    const x1 = maxX - inset
    const z0 = minZ + inset
    const z1 = maxZ - inset
    segments.push(
      [
        [x0, z0],
        [x1, z0],
      ],
      [
        [x1, z0],
        [x1, z1],
      ],
      [
        [x1, z1],
        [x0, z1],
      ],
      [
        [x0, z1],
        [x0, z0],
      ],
    )
  }
  border(0.65)
  border(1.05)

  const reach = maxX - minX + maxZ - minZ
  const centreX = (minX + maxX) / 2
  const centreZ = (minZ + maxZ) / 2
  for (let offset = -reach; offset <= reach; offset += 3.2) {
    segments.push(
      ...clipSegment(
        polygon,
        [centreX - reach, centreZ + offset - reach],
        [centreX + reach, centreZ + offset + reach],
      ),
      ...clipSegment(
        polygon,
        [centreX - reach, centreZ + offset + reach],
        [centreX + reach, centreZ + offset - reach],
      ),
    )
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

export function floorPatternOf(space: Space): FloorPattern | null {
  if (
    space.id === 'tier-1-king-living-quarters-living' ||
    space.id === 'tier-1-royal-residential-sector-room-1004-living'
  ) {
    return { kind: 'geometric-inlay', style: 'inlay', segments: geometricInlay(space.footprint) }
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
  return null
}

import { describe, expect, it } from 'vitest'
import {
  DOOR_WIDTH,
  collinearOverlap,
  deriveDoorways,
  interiorPoint,
  pointInPolygon,
  polygonArea,
  polygonsOverlap,
  sealKey,
  signedArea,
  structureFootprint,
  structureWalls,
  triangulate,
  wallSegments,
} from './geometry'
import type { Polygon, Space, Structure, Vec2 } from './types'

const square: Polygon = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
]

/** An L, to keep the concave path honest. */
const ell: Polygon = [
  [0, 0],
  [10, 0],
  [10, 4],
  [4, 4],
  [4, 10],
  [0, 10],
]

function space(
  id: string,
  footprint: Polygon,
  tierId = 'tier-1',
  envelope: string | null = null,
): Space {
  return {
    id,
    tierId,
    locationId: null,
    name: id,
    nameFr: id,
    category: 'room',
    provenance: 'inferred',
    source: 'test',
    sourceFr: 'test',
    ceiling: null,
    envelope,
    footprint,
  }
}

/** The square immediately to starboard of `square`, sharing its x = 10 wall. */
const neighbour: Polygon = [
  [10, 0],
  [20, 0],
  [20, 10],
  [10, 10],
]

describe('polygon basics', () => {
  it('measures area regardless of winding', () => {
    expect(polygonArea(square)).toBe(100)
    expect(polygonArea([...square].reverse())).toBe(100)
  })

  it('reports winding through the sign of the area', () => {
    expect(signedArea(square)).toBeGreaterThan(0)
    expect(signedArea([...square].reverse())).toBeLessThan(0)
  })

  it('tells inside from outside, including in the notch of a concave room', () => {
    expect(pointInPolygon([5, 5], square)).toBe(true)
    expect(pointInPolygon([15, 5], square)).toBe(false)
    expect(pointInPolygon([2, 2], ell)).toBe(true)
    expect(pointInPolygon([8, 8], ell)).toBe(false)
  })
})

describe('collinearOverlap', () => {
  it('finds the shared stretch of two touching walls', () => {
    const overlap = collinearOverlap([0, 0], [10, 0], [4, 0], [12, 0])
    expect(overlap).toEqual({ from: 4, to: 10 })
  })

  it('ignores walls that are merely parallel', () => {
    expect(collinearOverlap([0, 0], [10, 0], [0, 1], [10, 1])).toBeNull()
  })

  it('ignores walls that meet at a single point', () => {
    expect(collinearOverlap([0, 0], [10, 0], [10, 0], [20, 0])).toBeNull()
  })
})

describe('deriveDoorways', () => {
  it('opens a doorway where two rooms share a wall', () => {
    const doorways = deriveDoorways([
      space('a', square),
      space('b', [
        [10, 0],
        [20, 0],
        [20, 10],
        [10, 10],
      ]),
    ])

    expect(doorways).toHaveLength(1)
    expect(doorways[0].width).toBe(DOOR_WIDTH)
    // Centred on the shared wall at x = 10.
    expect(doorways[0].start[0]).toBeCloseTo(10)
    expect(doorways[0].end[0]).toBeCloseTo(10)
    expect((doorways[0].start[1] + doorways[0].end[1]) / 2).toBeCloseTo(5)
  })

  it('leaves rooms that only touch at a corner sealed', () => {
    const doorways = deriveDoorways([
      space('a', square),
      space('b', [
        [10, 10],
        [20, 10],
        [20, 20],
        [10, 20],
      ]),
    ])
    expect(doorways).toEqual([])
  })

  it('never joins two spaces on different tiers', () => {
    const doorways = deriveDoorways([
      space('a', square, 'tier-1'),
      space(
        'b',
        [
          [10, 0],
          [20, 0],
          [20, 10],
          [10, 10],
        ],
        'tier-2',
      ),
    ])
    expect(doorways).toEqual([])
  })

  it('leaves a sealed pair of rooms with no way through', () => {
    const a = space('a', square)
    const b = space('b', neighbour)
    expect(deriveDoorways([a, b], { sealed: new Set([sealKey('a', 'b')]) })).toEqual([])
    // The seal is order-independent.
    expect(deriveDoorways([a, b], { sealed: new Set([sealKey('b', 'a')]) })).toEqual([])
  })

  it('never joins two rooms that belong to different units', () => {
    const a = space('a', square, 'tier-1', 'apartment-1')
    const b = space('b', neighbour, 'tier-1', 'apartment-2')
    expect(deriveDoorways([a, b])).toEqual([])
  })

  it('joins rooms inside the same unit as usual', () => {
    const a = space('a', square, 'tier-1', 'apartment-1')
    const b = space('b', neighbour, 'tier-1', 'apartment-1')
    expect(deriveDoorways([a, b])).toHaveLength(1)
  })

  it('shuts a room off from everything outside its unit', () => {
    const a = space('a', square, 'tier-1', 'apartment-1')
    const corridor = space('b', neighbour)
    expect(deriveDoorways([a, corridor])).toEqual([])
  })

  it('opens a declared door even across units, where it was declared', () => {
    const a = space('a', square, 'tier-1', 'apartment-1')
    const corridor = space('b', neighbour)
    const doorways = deriveDoorways([a, corridor], {
      overrides: new Map([
        [
          sealKey('a', 'b'),
          {
            a: 'a',
            b: 'b',
            at: [10, 8] as Vec2,
            width: 2,
            reason: 'front door',
            reasonFr: 'porte d’entrée',
          },
        ],
      ]),
    })

    expect(doorways).toHaveLength(1)
    expect(doorways[0].width).toBe(2)
    // Centred on z = 8, where it was asked for, not on the middle of the wall.
    expect((doorways[0].start[1] + doorways[0].end[1]) / 2).toBeCloseTo(8)
  })

  it('pulls a declared door back inside the wall it is on', () => {
    const a = space('a', square, 'tier-1', 'apartment-1')
    const corridor = space('b', neighbour)
    const doorways = deriveDoorways([a, corridor], {
      overrides: new Map([
        [
          sealKey('a', 'b'),
          {
            a: 'a',
            b: 'b',
            at: [10, 40] as Vec2,
            width: 2,
            reason: 'off the end',
            reasonFr: 'hors du mur',
          },
        ],
      ]),
    })

    const centre = (doorways[0].start[1] + doorways[0].end[1]) / 2
    expect(centre).toBeGreaterThanOrEqual(1)
    expect(centre).toBeLessThanOrEqual(9)
  })

  it('narrows the opening to the wall when the wall is short', () => {
    const doorways = deriveDoorways([
      space('a', square),
      space('b', [
        [10, 4],
        [20, 4],
        [20, 6],
        [10, 6],
      ]),
    ])
    expect(doorways[0].width).toBeCloseTo(2)
  })
})

describe('wallSegments', () => {
  it('leaves a sealed room with one wall per edge', () => {
    expect(wallSegments(space('a', square), [])).toHaveLength(4)
  })

  it('cuts the doorway out and keeps the wall either side of it', () => {
    const a = space('a', square)
    const doorways = deriveDoorways([
      a,
      space('b', [
        [10, 0],
        [20, 0],
        [20, 10],
        [10, 10],
      ]),
    ])
    const walls = wallSegments(a, doorways)

    // Three untouched edges, plus the two stubs either side of the opening.
    expect(walls).toHaveLength(5)

    const onSharedWall = walls.filter((wall) => wall.start[0] === 10 && wall.end[0] === 10)
    expect(onSharedWall).toHaveLength(2)
    const covered = onSharedWall.reduce(
      (total, wall) => total + Math.abs(wall.end[1] - wall.start[1]),
      0,
    )
    expect(covered).toBeCloseTo(10 - DOOR_WIDTH)
  })
})

describe('triangulate', () => {
  it('covers a convex room exactly', () => {
    const triangles = triangulate(square)
    expect(triangles).toHaveLength(6)
    expect(areaOfTriangles(square, triangles)).toBeCloseTo(polygonArea(square))
  })

  it('covers a concave room exactly', () => {
    const triangles = triangulate(ell)
    expect(areaOfTriangles(ell, triangles)).toBeCloseTo(polygonArea(ell))
  })

  it('returns indices into the polygon as given, whatever its winding', () => {
    const reversed = [...square].reverse()
    expect(areaOfTriangles(reversed, triangulate(reversed))).toBeCloseTo(100)
  })
})

describe('polygonsOverlap', () => {
  it('accepts rooms that only share a wall', () => {
    expect(
      polygonsOverlap(square, [
        [10, 0],
        [20, 0],
        [20, 10],
        [10, 10],
      ]),
    ).toBe(false)
  })

  it('rejects rooms that share floor', () => {
    expect(
      polygonsOverlap(square, [
        [5, 5],
        [15, 5],
        [15, 15],
        [5, 15],
      ]),
    ).toBe(true)
  })

  it('rejects rooms that cross without either corner falling inside', () => {
    expect(
      polygonsOverlap(square, [
        [-5, 4],
        [15, 4],
        [15, 6],
        [-5, 6],
      ]),
    ).toBe(true)
  })
})

describe('structureFootprint', () => {
  const coffin: Structure = {
    id: 'coffin',
    spaceId: 'chamber',
    kind: 'casket',
    name: 'Coffin',
    nameFr: 'Cercueil',
    at: [0, 0],
    size: [1, 3],
    rotation: 0,
    height: 0.85,
    sides: null,
    provenance: 'panel',
    source: 'source',
    sourceFr: 'source',
  }

  it('draws a rectangle the size it was given', () => {
    expect(polygonArea(structureFootprint(coffin))).toBeCloseTo(3)
  })

  it('turns it about its own centre, keeping the area', () => {
    const turned = structureFootprint({ ...coffin, rotation: 90 })
    expect(polygonArea(turned)).toBeCloseTo(3)
    // Its long side now runs across x rather than along z.
    const xs = turned.map((point) => point[0])
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(3)
  })

  it('places a turned solid around the point it stands on', () => {
    const moved = structureFootprint({ ...coffin, at: [4, -2], rotation: 30 })
    expect(pointInPolygon([4, -2], moved)).toBe(true)
  })

  it('cuts a round solid as a polygon inside the box it was given', () => {
    const spring = structureFootprint({ ...coffin, sides: 16, size: [4, 4] })
    expect(spring).toHaveLength(16)
    // Inscribed, so it comes in just under the circle of the same width.
    expect(polygonArea(spring)).toBeLessThan(Math.PI * 4)
    expect(polygonArea(spring)).toBeGreaterThan(Math.PI * 3.8)
  })

  it('gives one wall per side, for the visitor to collide with', () => {
    expect(structureWalls(coffin)).toHaveLength(4)
    expect(structureWalls({ ...coffin, sides: 16 })).toHaveLength(16)
    expect(structureWalls(coffin)[0].spaceId).toBe('chamber')
  })
})

describe('interiorPoint', () => {
  it('lands inside a concave room rather than in its notch', () => {
    expect(pointInPolygon(interiorPoint(ell), ell)).toBe(true)
  })
})

function areaOfTriangles(polygon: Polygon, triangles: number[]): number {
  let total = 0
  for (let i = 0; i < triangles.length; i += 3) {
    const a = polygon[triangles[i]]
    const b = polygon[triangles[i + 1]]
    const c = polygon[triangles[i + 2]]
    total += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
  }
  return total
}

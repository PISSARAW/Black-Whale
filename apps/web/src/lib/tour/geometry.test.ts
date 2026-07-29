import { describe, expect, it } from 'vitest'
import {
  DOOR_WIDTH,
  collinearOverlap,
  deriveDoorways,
  interiorPoint,
  pointInPolygon,
  polygonArea,
  polygonsOverlap,
  signedArea,
  triangulate,
  wallSegments,
} from './geometry'
import type { Polygon, Space } from './types'

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

function space(id: string, footprint: Polygon, tierId = 'tier-1'): Space {
  return {
    id,
    tierId,
    locationId: null,
    name: id,
    nameFr: id,
    category: 'room',
    provenance: 'inferred',
    source: 'test',
    ceiling: null,
    footprint,
  }
}

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
      space(
        'b',
        [
          [10, 0],
          [20, 0],
          [20, 10],
          [10, 10],
        ],
      ),
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
      space(
        'b',
        [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
        ],
      ),
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

  it('narrows the opening to the wall when the wall is short', () => {
    const doorways = deriveDoorways([
      space('a', square),
      space(
        'b',
        [
          [10, 4],
          [20, 4],
          [20, 6],
          [10, 6],
        ],
      ),
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
      space(
        'b',
        [
          [10, 0],
          [20, 0],
          [20, 10],
          [10, 10],
        ],
      ),
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

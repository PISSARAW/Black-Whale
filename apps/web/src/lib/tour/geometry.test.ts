import { describe, expect, it } from 'vitest'
import {
  BAR_PITCH,
  BAR_THICKNESS,
  DOOR_WIDTH,
  PLATE_PITCH,
  clipSegment,
  collinearOverlap,
  distanceToBoundary,
  deriveDoorways,
  grilleBars,
  interiorPoint,
  longestChord,
  perimeter,
  plateSeams,
  pointInPolygon,
  polygonArea,
  polygonsOverlap,
  sealKey,
  signedArea,
  structureFootprint,
  structureWalls,
  subdivideTriangle,
  triangulate,
  wallSegments,
} from './geometry'
import type { Polygon, Space, Structure, Triangle, Vec2 } from './types'

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
    const overlap = collinearOverlap(
      [
        [0, 0],
        [10, 0],
      ],
      [
        [4, 0],
        [12, 0],
      ],
    )
    expect(overlap).toEqual({ from: 4, to: 10 })
  })

  it('ignores walls that are merely parallel', () => {
    expect(
      collinearOverlap(
        [
          [0, 0],
          [10, 0],
        ],
        [
          [0, 1],
          [10, 1],
        ],
      ),
    ).toBeNull()
  })

  it('ignores walls that meet at a single point', () => {
    expect(
      collinearOverlap(
        [
          [0, 0],
          [10, 0],
        ],
        [
          [10, 0],
          [20, 0],
        ],
      ),
    ).toBeNull()
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
    base: 0,
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

describe('grilleBars', () => {
  const grille: Structure = {
    id: 'grille',
    spaceId: 'cell',
    kind: 'bars',
    name: 'Cell Bars',
    nameFr: 'Barreaux de cellule',
    at: [0, 0],
    size: [4, 0.14],
    rotation: 0,
    base: 0,
    height: 2.6,
    sides: null,
    provenance: 'plan',
    source: 'source',
    sourceFr: 'source',
  }

  it('fills the run with uprights at the spacing a cell is barred at', () => {
    const bars = grilleBars(grille)
    expect(bars.length).toBe(Math.round(4 / BAR_PITCH))
    for (const bar of bars) {
      const xs = bar.map((point) => point[0])
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(BAR_THICKNESS)
    }
  })

  it('keeps every upright inside the run the visitor collides with', () => {
    for (const rotation of [0, 30, 90]) {
      const outline = structureFootprint({ ...grille, rotation })
      for (const bar of grilleBars({ ...grille, rotation })) {
        for (const corner of bar) {
          // The end uprights sit on the face of the run, so a corner counts as
          // inside when it is on the outline as well as within it.
          expect(pointInPolygon(corner, outline) || onEdge(corner, outline)).toBe(true)
        }
      }
    }
  })

  it('runs the uprights along the long axis, whichever it is', () => {
    const acrossZ = grilleBars({ ...grille, size: [0.14, 4] })
    expect(acrossZ.length).toBe(Math.round(4 / BAR_PITCH))
    const zs = acrossZ.map((bar) => bar[0][1])
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(3)
  })
})

/** Whether a point sits on the outline rather than strictly within it. */
function onEdge(point: Vec2, polygon: Polygon): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1])) /
          ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2),
      ),
    )
    const closest = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    if (Math.hypot(point[0] - closest[0], point[1] - closest[1]) < 0.001) return true
  }
  return false
}

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

describe('the measurements the fog and the reverberation are read from', () => {
  const square: Polygon = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ]

  it('measures the perimeter a room presents to sound', () => {
    expect(perimeter(square)).toBeCloseTo(40)
  })

  it('takes the longest chord corner to corner, not the longest side', () => {
    expect(longestChord(square)).toBeCloseTo(Math.hypot(10, 10))
  })

  it('reads a corridor as long even when it bends', () => {
    // The visitor walks the bend, so an L-shaped hall is still a long hall.
    expect(longestChord(ell)).toBeGreaterThan(10)
  })

  it('measures how far a point stands from the nearest wall', () => {
    expect(distanceToBoundary([5, 5], square)).toBeCloseTo(5)
    expect(distanceToBoundary([0.5, 5], square)).toBeCloseTo(0.5)
    expect(distanceToBoundary([0, 0], square)).toBeCloseTo(0)
  })
})

describe('clipSegment', () => {
  const square: Polygon = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ]

  it('keeps the stretch that crosses the room and drops the rest', () => {
    const spans = clipSegment(square, [-5, 5], [15, 5])
    expect(spans).toHaveLength(1)
    expect(spans[0][0][0]).toBeCloseTo(0)
    expect(spans[0][1][0]).toBeCloseTo(10)
  })

  it('returns nothing for a line that misses the room', () => {
    expect(clipSegment(square, [-5, 20], [15, 20])).toHaveLength(0)
  })

  it('returns both stretches when a concave room takes a bite out of the line', () => {
    // Two arms of an L that a line can cross with a gap between them.
    const horseshoe: Polygon = [
      [0, 0],
      [10, 0],
      [10, 10],
      [7, 10],
      [7, 3],
      [3, 3],
      [3, 10],
      [0, 10],
    ]
    const spans = clipSegment(horseshoe, [-1, 6], [11, 6])
    expect(spans).toHaveLength(2)
  })
})

describe('plateSeams', () => {
  const hall: Polygon = [
    [0, 0],
    [24, 0],
    [24, 12],
    [0, 12],
  ]

  it('lays a course about every stride, both ways across the deck', () => {
    const seams = plateSeams(hall)
    expect(seams.length).toBeGreaterThan(((24 + 12) / PLATE_PITCH) * 0.8)
    for (const [a, b] of seams) {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1])
      expect(length).toBeGreaterThan(0)
      // Every seam is a straight run across the room, not a stub in a corner.
      expect(length).toBeLessThanOrEqual(24.001)
    }
  })

  it('lays the plating on the ship rather than on the room', () => {
    // Two rooms side by side share the courses that run through both, so the
    // plating carries on through a doorway instead of restarting at it.
    const shifted: Polygon = hall.map(([x, z]) => [x + PLATE_PITCH * 3, z] as Vec2)
    const xs = (polygon: Polygon) =>
      plateSeams(polygon)
        .filter(([a, b]) => Math.abs(a[0] - b[0]) < 0.001)
        .map(([a]) => Math.round((a[0] / PLATE_PITCH) * 1000) / 1000)
    for (const x of xs(shifted)) expect(Number.isInteger(x)).toBe(true)
    for (const x of xs(hall)) expect(Number.isInteger(x)).toBe(true)
  })

  it('keeps every seam inside the room it plates', () => {
    for (const [a, b] of plateSeams(ell)) {
      const middle: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      expect(pointInPolygon(middle, ell)).toBe(true)
    }
  })

  it('draws nothing for a pitch that would never terminate', () => {
    expect(plateSeams(hall, 0)).toHaveLength(0)
  })
})

describe('subdivideTriangle', () => {
  const long: [Vec2, Vec2, Vec2] = [
    [0, 0],
    [30, 0],
    [0, 18],
  ]

  it('leaves a small triangle alone', () => {
    expect(
      subdivideTriangle(
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        2,
      ),
    ).toHaveLength(1)
  })

  it('cuts every edge down to the patch size', () => {
    const pieces = subdivideTriangle(long, 2)
    for (const [a, b, c] of pieces) {
      for (const [p, q] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        expect(Math.hypot(q[0] - p[0], q[1] - p[1])).toBeLessThanOrEqual(2.0001)
      }
    }
  })

  it('covers exactly the triangle it was given', () => {
    const whole = Math.abs((30 - 0) * (18 - 0)) / 2
    const pieces = subdivideTriangle(long, 2)
    const total = pieces.reduce(
      (sum, [a, b, c]) =>
        sum + Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2,
      0,
    )
    expect(total).toBeCloseTo(whole, 6)
  })

  it('splits at the middle of an edge, so neighbours agree and no crack opens', () => {
    // Two triangles sharing the long edge must produce the same points along it.
    const left = subdivideTriangle(
      [
        [0, 0],
        [8, 0],
        [0, 6],
      ],
      2,
    )
    const right = subdivideTriangle(
      [
        [8, 0],
        [0, 0],
        [8, -6],
      ],
      2,
    )
    const onEdge = (pieces: Triangle[]) =>
      new Set(
        pieces
          .flat()
          .filter((point) => Math.abs(point[1]) < 0.0001)
          .map((point) => point[0].toFixed(4)),
      )
    expect([...onEdge(left)].sort()).toEqual([...onEdge(right)].sort())
  })

  it('is left alone by a patch size of zero rather than recursing forever', () => {
    expect(subdivideTriangle(long, 0)).toHaveLength(1)
  })
})

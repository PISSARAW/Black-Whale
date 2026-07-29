import { describe, expect, it } from 'vitest'
import { buildShip, spaceAt, spawnPoint } from './blueprint'
import { pointInPolygon } from './geometry'
import { LINK_REACH, VISITOR_RADIUS, linkUnderfoot, resolveMovement, wallsNear } from './navigation'
import type { Link, Vec2, WallSegment } from './types'

/** A wall running along x = 0, from z = -10 to z = 10. */
const wall: WallSegment[] = [{ spaceId: 'a', start: [0, -10], end: [0, 10] }]

describe('resolveMovement', () => {
  it('lets the visitor walk where nothing is in the way', () => {
    const end = resolveMovement([-5, 0], [-3, 0], wall)
    expect(end[0]).toBeCloseTo(-3)
    expect(end[1]).toBeCloseTo(0)
  })

  it('stops the visitor at a wall rather than through it', () => {
    const end = resolveMovement([-5, 0], [5, 0], wall)
    expect(end[0]).toBeLessThan(0)
    expect(end[0]).toBeCloseTo(-VISITOR_RADIUS)
  })

  it('does not let a sprint tunnel through a wall', () => {
    // A single frame long enough to clear the wall entirely.
    const end = resolveMovement([-5, 0], [500, 0], wall)
    expect(end[0]).toBeCloseTo(-VISITOR_RADIUS)
  })

  it('slides along a wall the visitor pushes into at an angle', () => {
    const end = resolveMovement([-1, 0], [1, 4], wall)
    expect(end[0]).toBeCloseTo(-VISITOR_RADIUS)
    expect(end[1]).toBeGreaterThan(0)
  })

  it('goes through the gap where a doorway was cut', () => {
    const withDoor: WallSegment[] = [
      { spaceId: 'a', start: [0, -10], end: [0, -1.5] },
      { spaceId: 'a', start: [0, 1.5], end: [0, 10] },
    ]
    expect(resolveMovement([-5, 0], [5, 0], withDoor)[0]).toBeGreaterThan(0)
  })

  it('does not squeeze the visitor through a corner between two walls', () => {
    const corner: WallSegment[] = [
      { spaceId: 'a', start: [0, 0], end: [0, 10] },
      { spaceId: 'a', start: [0, 0], end: [10, 0] },
    ]
    const end = resolveMovement([-1, -1], [3, 3], corner)
    expect(end[0]).toBeLessThanOrEqual(0)
    expect(end[1]).toBeLessThanOrEqual(0)
  })
})

describe('wallsNear', () => {
  it('keeps the walls within reach and drops the rest', () => {
    const walls: WallSegment[] = [
      { spaceId: 'a', start: [0, 0], end: [0, 5] },
      { spaceId: 'b', start: [900, 0], end: [900, 5] },
    ]
    expect(wallsNear(walls, [1, 1], 3).map((w) => w.spaceId)).toEqual(['a'])
  })
})

describe('linkUnderfoot', () => {
  const links: Link[] = [
    {
      from: 'a',
      to: 'b',
      kind: 'stair',
      at: [0, 0],
      provenance: 'inferred',
      source: 'test',
    },
  ]

  it('offers the other end when the visitor stands on it', () => {
    expect(linkUnderfoot(links, 'a', [1, 1])?.to).toBe('b')
  })

  it('works from either end', () => {
    expect(linkUnderfoot(links, 'b', [1, 1])?.to).toBe('a')
  })

  it('offers nothing from too far away', () => {
    expect(linkUnderfoot(links, 'a', [LINK_REACH + 1, 0])).toBeNull()
  })

  it('offers nothing from a space the link does not touch', () => {
    expect(linkUnderfoot(links, 'c', [0, 0])).toBeNull()
  })
})

describe('walking the reconstruction itself', () => {
  const ship = buildShip()

  it('keeps the visitor inside the ship from every spawn point', () => {
    for (const [tierId, plan] of ship.plans) {
      for (const space of plan.spaces) {
        const start = spawnPoint(space)
        // Shove hard in each direction; every push has to end up somewhere
        // that is still a room, never out in the hull.
        for (const direction of [
          [20, 0],
          [-20, 0],
          [0, 20],
          [0, -20],
        ] as Vec2[]) {
          const target: Vec2 = [start[0] + direction[0], start[1] + direction[1]]
          const end = resolveMovement(start, target, plan.walls)
          const landed = spaceAt(plan, end)
          expect(landed, `${tierId}/${space.id} walked out of the ship`).not.toBeNull()
        }
      }
    }
  })

  it('never spawns the visitor inside a wall', () => {
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const start = spawnPoint(space)
        expect(pointInPolygon(start, space.footprint)).toBe(true)
        expect(resolveMovement(start, start, plan.walls)).toEqual(start)
      }
    }
  })
})

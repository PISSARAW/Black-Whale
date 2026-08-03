import { describe, expect, it } from 'vitest'
import { buildShip, crossingsOn, spaceAt, spawnPoint } from './blueprint'
import { pointInPolygon } from './geometry'
import {
  ACCEL,
  BREATH_RISE,
  FRICTION,
  LINK_REACH,
  SPRINT_SPEED,
  STICK_RADIUS,
  STICK_RIM,
  VISITOR_RADIUS,
  WALK_SPEED,
  breathOf,
  glide,
  linkUnderfoot,
  resolveMovement,
  stickVector,
  walkInput,
  wallsNear,
  wayOutOfInterior,
  type WalkKeys,
} from './navigation'
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
      sourceFr: 'test',
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

  it('offers a door from anywhere in the room it belongs to', () => {
    const doorway: Link[] = [
      {
        from: 'a',
        to: 'b',
        kind: 'door',
        at: [0, 0],
        atTo: [5, 5],
        provenance: 'plan',
        source: 't',
        sourceFr: 't',
      },
    ]
    expect(linkUnderfoot(doorway, 'a', [LINK_REACH * 20, 0])?.to).toBe('b')
  })

  it('offers nothing from a space the link does not touch', () => {
    expect(linkUnderfoot(links, 'c', [0, 0])).toBeNull()
  })
})

describe('wayOutOfInterior', () => {
  const ship = buildShip()
  const interior = ship.tiers.find((tier) => tier.kind === 'interior')!

  it('offers the way out from every room of an interior, not only its vestibule', () => {
    const rooms = ship.blueprint.spaces.filter((space) => space.tierId === interior.id)
    expect(rooms.length).toBeGreaterThan(1)
    for (const room of rooms) {
      const out = wayOutOfInterior(ship.links, interior)
      expect(out).not.toBeNull()
      // And it comes out on the deck, whichever room you were standing in.
      expect(out!.to).toBe(interior.parentSpaceId)
      expect(ship.spaces.get(out!.to)?.tierId).not.toBe(room.tierId)
    }
  })

  it('offers nothing on a deck, where the stairwells have to be stood on', () => {
    const deck = ship.decks[0]
    expect(wayOutOfInterior(ship.links, deck)).toBeNull()
  })

  it('offers nothing for an interior no door joins', () => {
    expect(wayOutOfInterior([], interior)).toBeNull()
    expect(wayOutOfInterior(ship.links, { kind: 'interior', parentSpaceId: null })).toBeNull()
  })

  it('agrees with the door the vestibule itself offers', () => {
    const entrance = ship.links.find(
      (link) => link.kind === 'door' && link.from === interior.parentSpaceId,
    )!
    const fromVestibule = linkUnderfoot(ship.links, entrance.to, [0, 0])
    expect(fromVestibule?.to).toBe(wayOutOfInterior(ship.links, interior)?.to)
  })
})

describe('crossingsOn', () => {
  const ship = buildShip()

  it('places a stairwell on both of the levels it joins', () => {
    const stair = ship.links.find((link) => link.kind === 'stair')!
    const lower = ship.spaces.get(stair.from)!
    const upper = ship.spaces.get(stair.to)!
    const fromBelow = crossingsOn(ship, lower.tierId).find((crossing) => crossing.link === stair)
    const fromAbove = crossingsOn(ship, upper.tierId).find((crossing) => crossing.link === stair)
    expect(fromBelow?.to).toBe(stair.to)
    expect(fromAbove?.to).toBe(stair.from)
  })

  it('says which way a stairwell goes, so the plan can draw an arrow', () => {
    const stair = ship.links.find((link) => link.kind === 'stair')!
    const lower = ship.spaces.get(stair.from)!
    const upper = ship.spaces.get(stair.to)!
    const fromBelow = crossingsOn(ship, lower.tierId).find((crossing) => crossing.link === stair)!
    const fromAbove = crossingsOn(ship, upper.tierId).find((crossing) => crossing.link === stair)!
    expect(Math.sign(fromBelow.rise)).toBe(-Math.sign(fromAbove.rise))
    expect(Math.abs(fromBelow.rise)).toBeGreaterThan(1)
  })

  it('reads a door into an interior in the coordinates of the level asked for', () => {
    const door = ship.links.find((link) => link.kind === 'door' && link.atTo)!
    const inside = ship.spaces.get(door.to)!
    const fromInside = crossingsOn(ship, inside.tierId).find((crossing) => crossing.link === door)!
    expect(fromInside.at).toEqual(door.atTo)
    // An interior sits at its deck's elevation, so its door is level.
    expect(fromInside.rise).toBe(0)
  })

  it('accounts for every link, once per level it touches', () => {
    const counted = ship.tiers.flatMap((tier) => crossingsOn(ship, tier.id))
    expect(counted.length).toBe(ship.links.length * 2)
  })

  it('gives nothing for a level nothing joins', () => {
    expect(crossingsOn(ship, 'no-such-level')).toEqual([])
  })
})

describe('the on-screen stick', () => {
  it('reads the middle of its base as standing still', () => {
    const [x, z] = stickVector(0, 0)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })

  it('reads a push up the screen as forward', () => {
    const [x, z] = stickVector(0, -STICK_RADIUS)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(1)
  })

  it('reads half a push as half a pace', () => {
    expect(stickVector(STICK_RADIUS / 2, 0)[0]).toBeCloseTo(0.5)
  })

  it('saturates at the rim however far the finger slides past it', () => {
    const near = stickVector(STICK_RADIUS * 2, 0)
    const far = stickVector(STICK_RADIUS * 40, 0)
    expect(Math.hypot(...near)).toBeCloseTo(1)
    expect(far).toEqual(near)
  })
})

describe('walkInput', () => {
  const still: WalkKeys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
  }

  it('stands still with nothing held and no finger on the stick', () => {
    expect(walkInput(still, null).moving).toBe(false)
  })

  it('normalises the keyboard diagonals, as it did before the stick existed', () => {
    const diagonal = walkInput({ ...still, forward: true, right: true }, null)
    expect(Math.hypot(diagonal.strafe, diagonal.advance)).toBeCloseTo(1)
    expect(diagonal.advance).toBeCloseTo(Math.SQRT1_2)
  })

  it('leaves a single key at full pace', () => {
    expect(walkInput({ ...still, forward: true }, null).advance).toBeCloseTo(1)
  })

  it('keeps a half push of the stick a half pace', () => {
    const half = walkInput(still, [0, 0.5])
    expect(half.moving).toBe(true)
    expect(half.advance).toBeCloseTo(0.5)
    expect(half.running).toBe(false)
  })

  it('runs when the stick is at its rim, and not before', () => {
    expect(walkInput(still, [0, STICK_RIM - 0.05]).running).toBe(false)
    expect(walkInput(still, [0, 1]).running).toBe(true)
  })

  it('does not let a key held down count as a run', () => {
    expect(walkInput({ ...still, forward: true }, null).running).toBe(false)
    expect(walkInput({ ...still, forward: true, sprint: true }, null).running).toBe(true)
  })

  it('adds the stick to the keys without ever leaving the unit circle', () => {
    const both = walkInput({ ...still, forward: true, right: true }, [1, 1])
    expect(Math.hypot(both.strafe, both.advance)).toBeLessThanOrEqual(1 + 1e-9)
  })
})

describe('walking the reconstruction itself', () => {
  const ship = buildShip()

  it('keeps the visitor inside the ship from every spawn point', () => {
    for (const [tierId, plan] of ship.plans) {
      for (const space of plan.spaces) {
        const start = spawnPoint(space, plan.structures)
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

  it('lets the visitor through the gate of a cell, and nowhere else along it', () => {
    for (const [cellId, outside] of [
      ['tier-1-vip-jail-cell-first-class', 'tier-1-vip-jail-corridor'],
      ['tier-1-vip-jail-cell-standard', 'tier-1-vip-jail-corridor'],
      ['tier-1-vvip-prison-beyond-cell', 'tier-1-vvip-prison-beyond-watch'],
    ]) {
      const cell = ship.spaces.get(cellId)!
      const plan = ship.plans.get(cell.tierId)!
      const front = plan.doorways.find(
        (door) => [door.a, door.b].includes(cellId) && [door.a, door.b].includes(outside),
      )!

      const span = Math.hypot(front.end[0] - front.start[0], front.end[1] - front.start[1])
      const along: Vec2 = [
        (front.end[0] - front.start[0]) / span,
        (front.end[1] - front.start[1]) / span,
      ]
      const across: Vec2 = [-along[1], along[0]]
      const middle: Vec2 = [
        (front.start[0] + front.end[0]) / 2,
        (front.start[1] + front.end[1]) / 2,
      ]
      // Which way the cell lies from its own front.
      const facing = pointInPolygon([middle[0] + across[0], middle[1] + across[1]], cell.footprint)
        ? 1
        : -1
      const step = (from: Vec2, distance: number): Vec2 => [
        from[0] + across[0] * facing * distance,
        from[1] + across[1] * facing * distance,
      ]

      // Straight at the gate: in.
      expect(
        pointInPolygon(
          resolveMovement(step(middle, -2), step(middle, 2), plan.walls),
          cell.footprint,
        ),
        `${cellId} cannot be entered`,
      ).toBe(true)

      // The same walk two metres along the front runs into the grille.
      const beside: Vec2 = [middle[0] + along[0] * 2, middle[1] + along[1] * 2]
      expect(
        pointInPolygon(
          resolveMovement(step(beside, -2), step(beside, 2), plan.walls),
          cell.footprint,
        ),
        `${cellId} can be walked into through its bars`,
      ).toBe(false)
    }
  })

  it('never spawns the visitor inside a wall', () => {
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const start = spawnPoint(space, plan.structures)
        expect(pointInPolygon(start, space.footprint)).toBe(true)
        expect(resolveMovement(start, start, plan.walls)).toEqual(start)
      }
    }
  })
})

describe('a single frame of walking', () => {
  /**
   * The bug this guards is the one that took walking away entirely.
   *
   * `resolveMovement` used to discard any move shorter than `EPSILON`, which is
   * the 5 cm tolerance for two coordinates being the same point. A frame of
   * walking is not that kind of quantity: at `WALK_SPEED` it is 3,5 cm at 60 Hz,
   * so every frame was thrown away and the visitor could only look around. The
   * old 6 m/s cleared the tolerance by luck.
   *
   * So the frame rates go up to the ones a display actually runs at, and both
   * paces have to arrive somewhere: a walk that is only felt on a slow monitor is
   * not a walk.
   */
  const RATES = [30, 60, 90, 120, 144, 240]

  for (const rate of RATES) {
    for (const [pace, speed] of [
      ['a walk', WALK_SPEED],
      ['a run', SPRINT_SPEED],
    ] as const) {
      it(`moves the visitor on one frame of ${pace} at ${rate} Hz`, () => {
        const step = speed / rate
        const from: Vec2 = [5, 0]
        const to: Vec2 = [5 + step, 0]
        // Clear of the wall, so nothing but the guard can stop the move.
        const after = resolveMovement(from, to, wall)
        expect(after[0] - from[0]).toBeCloseTo(step, 6)
      })
    }
  }

  it('covers the ground it was asked for, frame by frame', () => {
    // A second of walking down a clear corridor is a second of walking: the
    // per-frame moves have to accumulate, not round away.
    let at: Vec2 = [5, 0]
    for (let frame = 0; frame < 60; frame++) {
      at = resolveMovement(at, [at[0] + WALK_SPEED / 60, at[1]], wall)
    }
    expect(at[0] - 5).toBeCloseTo(WALK_SPEED, 3)
  })

  it('still refuses a move of nothing at all', () => {
    const from: Vec2 = [5, 0]
    expect(resolveMovement(from, [5, 0], wall)).toBe(from)
  })

  it('still stops a frame of either pace at a wall', () => {
    for (const speed of [WALK_SPEED, SPRINT_SPEED]) {
      const step = speed / 60
      // Walking into the wall at x = 0 from the visitor's own radius away.
      const from: Vec2 = [VISITOR_RADIUS, 0]
      const after = resolveMovement(from, [from[0] - step, 0], wall)
      expect(after[0]).toBeGreaterThanOrEqual(VISITOR_RADIUS - 0.001)
    }
  })
})

/**
 * A body has a mass.
 *
 * The walk used to reach full speed in the frame the key went down and stand
 * still in the frame it came up, which is not somebody walking, it is a cursor
 * being dragged. What is checked here is not the numbers — they are a reading of
 * what a person does — but that the two ends of it hold: nothing is instant, and
 * everything settles exactly.
 */
describe('leaning into a walk', () => {
  const forward: Vec2 = [0, WALK_SPEED]
  const rest: Vec2 = [0, 0]
  /** One frame at 60 Hz, which is what the walk is felt at. */
  const FRAME = 1 / 60

  it('does not reach the pace in the frame the key goes down', () => {
    const after = glide(rest, forward, FRAME)
    expect(after[1]).toBeGreaterThan(0)
    expect(after[1]).toBeLessThan(WALK_SPEED)
  })

  it('reaches it in about the fifth of a second a person takes', () => {
    let velocity = rest
    for (let frame = 0; frame < 60; frame++) {
      velocity = glide(velocity, forward, FRAME)
      if (velocity[1] >= WALK_SPEED) {
        const seconds = (frame + 1) * FRAME
        expect(seconds).toBeGreaterThan(0.1)
        expect(seconds).toBeLessThan(0.35)
        return
      }
    }
    throw new Error('the visitor never reached a walking pace')
  })

  it('stops harder than it starts, because you can put a foot down', () => {
    expect(FRICTION).toBeGreaterThan(ACCEL)
    const stopping = glide(forward, rest, FRAME)
    const starting = glide(rest, forward, FRAME)
    expect(WALK_SPEED - stopping[1]).toBeGreaterThan(starting[1])
  })

  it('settles exactly rather than approaching forever', () => {
    // A velocity always a thousandth off its own pace makes the gait drift
    // against the footsteps, which are counted off the ground covered.
    let velocity = rest
    for (let frame = 0; frame < 120; frame++) velocity = glide(velocity, forward, FRAME)
    expect(velocity).toEqual(forward)

    let stopping = forward
    for (let frame = 0; frame < 120; frame++) stopping = glide(stopping, rest, FRAME)
    expect(stopping).toEqual(rest)
  })

  it('turns without gaining or losing speed on the way round', () => {
    // A body at speed leans into a new direction; it does not stop first. Which
    // means the approach has to be a vector one — take the axes separately and a
    // diagonal turn is a sprint.
    const across: Vec2 = [WALK_SPEED, 0]
    const turning = glide(forward, across, FRAME)
    expect(Math.hypot(turning[0], turning[1])).toBeLessThanOrEqual(WALK_SPEED + 1e-9)
  })

  it('is the same walk at any frame rate', () => {
    // One second of leaning in, taken in sixty steps or in two hundred and forty.
    const settle = (rate: number) => {
      let velocity = rest
      for (let frame = 0; frame < rate; frame++) velocity = glide(velocity, forward, 1 / rate)
      return velocity[1]
    }
    expect(settle(240)).toBeCloseTo(settle(60), 9)
  })
})

describe('the breath at a stand', () => {
  it('lifts the eye by millimetres and comes back', () => {
    let highest = -Infinity
    let lowest = Infinity
    for (let i = 0; i <= 200; i++) {
      const rise = breathOf(i * 0.05)
      highest = Math.max(highest, rise)
      lowest = Math.min(lowest, rise)
    }
    expect(highest).toBeCloseTo(BREATH_RISE, 3)
    expect(lowest).toBeCloseTo(-BREATH_RISE, 3)
  })

  it('is smaller than a single pace of the head, and turns all the way off', () => {
    // It is only ever seen standing still, and it must never be what a visitor
    // who asked for no head movement is left with.
    expect(BREATH_RISE).toBeLessThan(0.022)
    expect(breathOf(3.7, 0)).toBeCloseTo(0, 12)
  })
})

import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import {
  CAPACITY,
  EMPTY_WORLD,
  RESTING_BODY,
  SOLID_HATSU_KINDS,
  TOUR_HATSU_KINDS,
  aimedSolid,
  aimedSpace,
  arriveInTour,
  castInTour,
  detachedOn,
  doorExit,
  emptiedOn,
  heldSolidIds,
  eyesOf,
  linkIsOpen,
  paceOf,
  planSealed,
  planWithout,
  shellsFor,
  solidNow,
  solidWalls,
  reachOf,
  walksThroughWalls,
  wanderOffset,
  worksInTour,
  wormExit,
  worldIsQuiet,
  type TourWorld,
} from './hatsu'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { pointInPolygon, structureFootprint } from './geometry'

const ship = buildShip()

/** A room with something standing in it, and a room on another deck. */
const furnished = [...ship.spaces.values()].find((space) =>
  ship.structures.some((structure) => structure.spaceId === space.id),
)!
const elsewhere = [...ship.spaces.values()].find((space) => space.tierId !== furnished.tierId)!

const cast = (world: TourWorld, kind: Parameters<typeof castInTour>[1], targetId: string | null) =>
  castInTour(world, kind, {
    ship,
    targetId,
    standingIn: null,
    at: [0, 0],
    random: () => 0,
  })

describe('the technique roster', () => {
  it('names only kinds the archive actually holds', () => {
    const known = new Set(HATSU_PROFILES.map((profile) => profile.kind))
    for (const kind of TOUR_HATSU_KINDS) expect(known).toContain(kind)
  })

  it('carries a technique across only when the walk can honour it', () => {
    const teleport = HATSU_PROFILES.find((profile) => profile.kind === 'teleport')!
    const poetry = HATSU_PROFILES.find((profile) => profile.kind === 'poetry')!
    expect(worksInTour(teleport)).toBe(true)
    expect(worksInTour(poetry)).toBe(false)
    expect(worksInTour(null)).toBe(false)
  })
})

describe('casting reaches the whole ship', () => {
  it('takes a room on another deck without asking where the visitor stands', () => {
    const result = castInTour(EMPTY_WORLD, 'paper-spy', {
      ship,
      targetId: elsewhere.id,
      standingIn: furnished.id,
      at: [0, 0],
    })
    expect(result.world.watched).toEqual([{ spaceId: elsewhere.id, visits: 0 }])
  })

  it('reports how far off and how many levels down the chain swung', () => {
    const result = castInTour(EMPTY_WORLD, 'dowsing', {
      ship,
      targetId: elsewhere.id,
      standingIn: furnished.id,
      at: [0, 0],
    })
    expect(result.report).toMatchObject({ kind: 'dowsed', spaceId: elsewhere.id })
    if (result.report.kind !== 'dowsed') throw new Error('unreachable')
    expect(result.report.decks).toBeGreaterThan(0)
    expect(result.world.dowsing).toBe(elsewhere.id)
  })

  it('sends the teleport somewhere the visitor is not, without being asked where', () => {
    const result = castInTour(EMPTY_WORLD, 'teleport', {
      ship,
      targetId: null,
      standingIn: furnished.id,
      at: [0, 0],
      random: () => 0,
    })
    expect(result.travelTo).toBeTruthy()
    expect(result.travelTo).not.toBe(furnished.id)
  })
})

describe('the hideout doors', () => {
  it('arms one frame, then pairs the second', () => {
    const first = cast(EMPTY_WORLD, 'door-network', furnished.id)
    expect(first.report.kind).toBe('door-armed')
    const paired = cast(first.world, 'door-network', elsewhere.id)
    expect(paired.report.kind).toBe('doors-paired')
    expect(paired.world.doors).toEqual([furnished.id, elsewhere.id])
  })

  it('starts a new pair rather than growing a network', () => {
    const paired = cast(cast(EMPTY_WORLD, 'door-network', furnished.id).world, 'door-network', elsewhere.id)
    const third = cast(paired.world, 'door-network', [...ship.spaces.keys()][3])
    expect(third.world.doors).toHaveLength(1)
  })

  it('comes out at the other frame, and does not fall straight back', () => {
    const world: TourWorld = { ...EMPTY_WORLD, doors: ['a', 'b'] }
    expect(doorExit(world, 'a', null)).toBe('b')
    expect(doorExit(world, 'b', 'b')).toBeNull()
    expect(doorExit(world, 'c', null)).toBeNull()
    expect(doorExit({ ...EMPTY_WORLD, doors: ['a'] }, 'a', null)).toBeNull()
  })
})

describe('Blinky and what refuses to be swallowed', () => {
  it('empties a room of what stands in it', () => {
    const result = cast(EMPTY_WORLD, 'vacuum', furnished.id)
    expect(result.world.emptied).toEqual([furnished.id])
    if (result.report.kind !== 'emptied') throw new Error('unreachable')
    expect(result.report.structures).toBeGreaterThan(0)
  })

  it('refuses a room another technique is holding, which is how the trap shows', () => {
    const isolated = cast(EMPTY_WORLD, 'room-isolation', furnished.id)
    const result = cast(isolated.world, 'vacuum', furnished.id)
    expect(result.report).toEqual({ kind: 'refused', spaceId: furnished.id })
    expect(result.world.emptied).toEqual([])
  })
})

describe('the isolated room', () => {
  it('lets the occupant keep the real room and the outsider get the copy', () => {
    const inside = castInTour(EMPTY_WORLD, 'room-isolation', {
      ship,
      targetId: furnished.id,
      standingIn: furnished.id,
      at: [0, 0],
    })
    expect(inside.world.isolated).toEqual({ spaceId: furnished.id, occupant: true })
    expect(emptiedOn(inside.world, furnished.tierId, ship)).not.toContain(furnished.id)

    const outside = cast(EMPTY_WORLD, 'room-isolation', furnished.id)
    expect(emptiedOn(outside.world, furnished.tierId, ship)).toContain(furnished.id)
  })

  it('only empties rooms on the deck being drawn', () => {
    const world = cast(EMPTY_WORLD, 'vacuum', elsewhere.id).world
    expect(emptiedOn(world, furnished.tierId, ship)).toEqual([])
    expect(emptiedOn(world, elsewhere.tierId, ship)).toEqual([elsewhere.id])
  })
})

describe('Air Blow', () => {
  it('strips every hold another technique put on the room, and moves nothing', () => {
    let world = cast(EMPTY_WORLD, 'room-isolation', furnished.id).world
    world = cast(world, 'paper-spy', furnished.id).world
    world = cast(world, 'scout', furnished.id).world

    const result = cast(world, 'blast', furnished.id)
    if (result.report.kind !== 'stripped') throw new Error('unreachable')
    expect(result.report.count).toBe(3)
    expect(worldIsQuiet(result.world)).toBe(true)
  })

  it('says plainly when there was nothing on the room to strip', () => {
    const result = cast(EMPTY_WORLD, 'blast', furnished.id)
    expect(result.report).toEqual({ kind: 'stripped', spaceId: furnished.id, count: 0 })
  })
})

describe('the senses', () => {
  it('seals sight, then hearing, then speech, and the fourth releases', () => {
    let world = EMPTY_WORLD
    for (const stage of [1, 2, 3, 0]) {
      const result = cast(world, 'senses', null)
      expect(result.world.sealed).toBe(stage)
      world = result.world
    }
  })
})

describe('what the aura draws through the hull', () => {
  it('lights every room in the ship under Emperor Time', () => {
    const result = cast(EMPTY_WORLD, 'scarlet', null)
    expect(result.world.laidOpen).toBe(true)
    expect(shellsFor(result.world, ship)).toHaveLength(ship.spaces.size)
  })

  it('keeps the room a doll sits in outlined from anywhere', () => {
    const world = cast(EMPTY_WORLD, 'paper-spy', elsewhere.id).world
    expect(shellsFor(world, ship)).toEqual([elsewhere.id])
  })
})

describe('planWithout', () => {
  it('takes both the solid and the faces the visitor would have walked around', () => {
    const plan = ship.plans.get(furnished.tierId)!
    const stripped = planWithout(plan, [furnished.id])
    expect(stripped.structures.length).toBeLessThan(plan.structures.length)
    expect(stripped.walls.length).toBeLessThan(plan.walls.length)
    expect(stripped.spaces).toEqual(plan.spaces)
  })

  it('hands back the same plan when nothing was emptied', () => {
    const plan = ship.plans.get(furnished.tierId)!
    expect(planWithout(plan, [])).toBe(plan)
  })
})

describe('aiming down the reticle', () => {
  it('reaches past the room underfoot to the one being faced', () => {
    const plan = ship.plans.get(ship.decks[0].id)!
    const [a, b] = plan.spaces
    const from = centreOf(a)
    const to = centreOf(b)
    // The camera looks along (-sin yaw, -cos yaw).
    const heading = Math.atan2(-(to[0] - from[0]), -(to[1] - from[1]))
    const aimed = aimedSpace(plan, from, heading, 400)
    expect(aimed).not.toBeNull()
    expect(aimed!.id).not.toBe(a.id)
  })

  it('falls back on the room underfoot when the ray leaves the deck', () => {
    const plan = ship.plans.get(ship.decks[0].id)!
    const space = plan.spaces[0]
    const aimed = aimedSpace(plan, centreOf(space), 0, 0.4)
    expect(aimed?.id).toBe(space.id)
  })
})

// ── The solids ────────────────────────────────────────────────────────────

/** A room with several solids in it, so the two-target techniques have a pair. */
const busiest = [...ship.spaces.values()]
  .map((space) => ({
    space,
    solids: ship.structures.filter((structure) => structure.spaceId === space.id),
  }))
  .sort((a, b) => b.solids.length - a.solids.length)[0]

const solidA = busiest.solids[0]
const solidB = busiest.solids[1]

const hit = (
  world: TourWorld,
  kind: Parameters<typeof castInTour>[1],
  solidId: string | null,
  extra: Partial<Parameters<typeof castInTour>[2]> = {},
) =>
  castInTour(world, kind, {
    ship,
    targetId: busiest.space.id,
    targetSolidId: solidId,
    standingIn: busiest.space.id,
    at: [0, 0],
    heading: 0,
    ...extra,
  })

describe('aiming at a solid', () => {
  it('routes the solid techniques to a solid and leaves the rest on the rooms', () => {
    expect(SOLID_HATSU_KINDS.has('impact')).toBe(true)
    expect(SOLID_HATSU_KINDS.has('vacuum')).toBe(false)
    for (const kind of SOLID_HATSU_KINDS) expect(TOUR_HATSU_KINDS).toContain(kind)
  })

  it('says so rather than doing nothing when the reticle holds no solid', () => {
    expect(hit(EMPTY_WORLD, 'impact', null).report).toEqual({ kind: 'no-solid' })
  })

  it('finds the solid the visitor is facing on the deck', () => {
    const plan = ship.plans.get(busiest.space.tierId)!
    const from = centreOf(busiest.space)
    const to = solidA.at
    const heading = Math.atan2(-(to[0] - from[0]), -(to[1] - from[1]))
    expect(aimedSolid(ship, EMPTY_WORLD, plan, from, heading, 120)).not.toBeNull()
  })
})

describe('what a technique does to a solid', () => {
  it('crushes it flat without moving it', () => {
    const result = hit(EMPTY_WORLD, 'impact', solidA.id)
    const crushed = solidNow(solidA, result.world.solids[solidA.id])
    expect(crushed.height).toBeLessThan(solidA.height)
    expect(crushed.at).toEqual(solidA.at)
  })

  it('wraps it small and unwraps it undamaged', () => {
    const wrapped = hit(EMPTY_WORLD, 'pocket', solidA.id)
    expect(solidNow(solidA, wrapped.world.solids[solidA.id]).size[0]).toBeLessThan(solidA.size[0])
    const back = hit(wrapped.world, 'pocket', solidA.id)
    expect(solidNow(solidA, back.world.solids[solidA.id]).size).toEqual(solidA.size)
  })

  it('changes only the look, never the thing underneath', () => {
    const result = hit(EMPTY_WORLD, 'disguise', solidA.id)
    const forged = solidNow(solidA, result.world.solids[solidA.id])
    expect(forged.kind).not.toBe(solidA.kind)
    expect(forged.size).toEqual(solidA.size)
    expect(forged.name).toBe(solidA.name)
  })

  it('never shoves a solid out through the wall of its room', () => {
    let world = EMPTY_WORLD
    // Twenty pushes in one direction: the room is what stops it, not a counter.
    for (let push = 0; push < 20; push++) world = hit(world, 'command', solidA.id).world
    const moved = solidNow(solidA, world.solids[solidA.id])
    const room = ship.spaces.get(solidA.spaceId)!
    const inside = structureFootprint(moved).every((corner) =>
      pointInPolygon(corner, room.footprint),
    )
    expect(inside).toBe(true)
  })

  it('lets the third volley finish it', () => {
    let world = EMPTY_WORLD
    const hits = [1, 2].map((n) => {
      world = hit(world, 'barrage', solidA.id).world
      return n
    })
    expect(hits).toHaveLength(2)
    const last = hit(world, 'barrage', solidA.id)
    expect(last.report).toEqual({ kind: 'shattered', solidId: solidA.id })
    expect(last.world.solids[solidA.id].gone).toBe(true)
  })

  it('winds the turns into the punch and spends them', () => {
    let world = EMPTY_WORLD
    world = hit(world, 'windup', null).world
    world = hit(world, 'windup', null).world
    expect(world.windup).toBe(2)
    const punch = hit(world, 'windup', solidA.id)
    if (punch.report.kind !== 'launched') throw new Error('unreachable')
    expect(punch.world.windup).toBe(0)
  })

  it('copies a solid as something no page supports', () => {
    const result = hit(EMPTY_WORLD, 'clone', solidA.id)
    expect(result.world.copies).toHaveLength(1)
    const copy = result.world.copies[0]
    expect(solidNow(copy, result.world.solids[copy.id]).provenance).toBe('inferred')
    expect(copy.at).not.toEqual(solidA.at)
  })
})

describe('the rules solids hold each other to', () => {
  it('holds a solid fast against every technique but the chain that undoes damage', () => {
    const bound = hit(EMPTY_WORLD, 'serpent', solidA.id).world
    expect(hit(bound, 'impact', solidA.id).report).toEqual({
      kind: 'bound-fast',
      solidId: solidA.id,
    })
    expect(hit(bound, 'growth', solidA.id).report).toMatchObject({ kind: 'bound-fast' })
    expect(hit(bound, 'stitch', solidA.id).world.solids[solidA.id]).toBeUndefined()
  })

  it('puts back whatever was done, and says when there was nothing to put back', () => {
    const crushed = hit(EMPTY_WORLD, 'impact', solidA.id).world
    const mended = hit(crushed, 'stitch', solidA.id)
    expect(worldIsQuiet(mended.world)).toBe(true)
    expect(hit(mended.world, 'stitch', solidA.id).report).toMatchObject({
      kind: 'nothing-to-stitch',
    })
  })

  it('sticks the confetti once and converges every later volley on that wound', () => {
    let world = hit(EMPTY_WORLD, 'shred', solidA.id).world
    expect(world.wound).toBe(solidA.id)
    // Aimed at the other solid, and it is still the first one that is cut.
    const cut = hit(world, 'shred', solidB.id)
    expect(cut.report).toMatchObject({ kind: 'shred-cut', solidId: solidA.id })
    world = cut.world
    for (let volley = 0; volley < 8 && !world.solids[solidA.id].gone; volley++) {
      world = hit(world, 'shred', solidB.id).world
    }
    expect(world.solids[solidA.id].gone).toBe(true)
    // The wound closes with the thing that carried it; the next cast opens a new one.
    expect(world.wound).toBeNull()
    expect(hit(world, 'shred', solidB.id).world.wound).toBe(solidB.id)
  })

  it('marks one, then blows the pair', () => {
    const sun = hit(EMPTY_WORLD, 'polarity', solidA.id)
    expect(sun.report).toMatchObject({ kind: 'marked', mark: 'sun' })
    const moon = hit(sun.world, 'polarity', solidB.id)
    expect(moon.report).toMatchObject({ kind: 'detonated' })
    expect(moon.world.solids[solidA.id].gone).toBe(true)
    expect(moon.world.solids[solidB.id].gone).toBe(true)
  })

  it('exchanges two appearances and leaves both where they stand', () => {
    const first = hit(EMPTY_WORLD, 'identity-swap', solidA.id)
    const swapped = hit(first.world, 'identity-swap', solidB.id).world
    expect(solidNow(solidA, swapped.solids[solidA.id]).kind).toBe(solidB.kind)
    expect(solidNow(solidB, swapped.solids[solidB.id]).kind).toBe(solidA.kind)
    expect(swapped.solids[solidA.id].at).toBeUndefined()
  })

  it('carries cargo to a relay on another deck', () => {
    const taken = hit(EMPTY_WORLD, 'relay', solidA.id)
    expect(taken.world.pairing).toBe(solidA.id)
    const landed = hit(taken.world, 'relay', null, { targetId: elsewhere.id })
    expect(landed.report).toMatchObject({ kind: 'cargo-landed', spaceId: elsewhere.id })
    expect(landed.world.pairing).toBeNull()
  })

  it('refuses to grow what Nen is already holding', () => {
    const alive = hit(EMPTY_WORLD, 'animate', solidA.id).world
    expect(hit(alive, 'growth', solidA.id).report).toMatchObject({ kind: 'growth-refused' })
  })
})

describe('the solids as the walk has to draw and collide with them', () => {
  it('lifts a touched solid out of the baked deck and hands it over on its own', () => {
    const world = hit(EMPTY_WORLD, 'impact', solidA.id).world
    const plan = ship.plans.get(busiest.space.tierId)!
    const baked = planWithout(plan, [], heldSolidIds(world))

    expect(baked.structures.some((structure) => structure.id === solidA.id)).toBe(false)
    expect(baked.walls.some((wall) => wall.structureId === solidA.id)).toBe(false)
    expect(detachedOn(ship, world, busiest.space.tierId).map((held) => held.structure.id)).toEqual([
      solidA.id,
    ])
    expect(solidWalls(ship, world, busiest.space.tierId).length).toBeGreaterThan(0)
  })

  it('stops handing over a solid that is gone', () => {
    const world = hit(EMPTY_WORLD, 'impact', solidA.id).world
    const shattered = { ...world, solids: { [solidA.id]: { gone: true } } }
    expect(detachedOn(ship, shattered, busiest.space.tierId)).toEqual([])
    expect(solidWalls(ship, shattered, busiest.space.tierId)).toEqual([])
  })

  it('gives an animated solid the same drift to the eye and to the shoulder', () => {
    expect(wanderOffset(solidA.id, 3)).toEqual(wanderOffset(solidA.id, 3))
    expect(wanderOffset(solidA.id, 3)).not.toEqual(wanderOffset(solidB.id, 3))

    const world = hit(EMPTY_WORLD, 'animate', solidA.id).world
    const still = detachedOn(ship, world, busiest.space.tierId, 0)[0].structure.at
    const later = detachedOn(ship, world, busiest.space.tierId, 4)[0].structure.at
    expect(later).not.toEqual(still)
  })

  it('blows every hold in a room off in one blast', () => {
    let world = hit(EMPTY_WORLD, 'impact', solidA.id).world
    world = hit(world, 'serpent', solidB.id).world
    const cleared = castInTour(world, 'blast', {
      ship,
      targetId: busiest.space.id,
      standingIn: null,
      at: [0, 0],
    })
    if (cleared.report.kind !== 'stripped') throw new Error('unreachable')
    expect(cleared.report.count).toBe(2)
    expect(worldIsQuiet(cleared.world)).toBe(true)
  })
})

// ── The doors ─────────────────────────────────────────────────────────────

/** A room with a doorway to shut, and the room on the other side of it. */
const joined = [...ship.plans.values()]
  .flatMap((plan) => plan.doorways)
  .find((door) => ship.spaces.get(door.a)?.tierId === busiest.space.tierId)!
const roomA = ship.spaces.get(joined.a)!
const roomB = ship.spaces.get(joined.b)!

const door = (
  world: TourWorld,
  kind: Parameters<typeof castInTour>[1],
  targetId: string | null,
  standingIn: string | null = null,
) => castInTour(world, kind, { ship, targetId, standingIn, at: [0, 0] })

describe('shutting a room', () => {
  it('takes the doorway out of the geometry rather than drawing a lock on it', () => {
    const plan = ship.plans.get(roomA.tierId)!
    const shut = planSealed(ship, plan, [roomA.id])

    const before = plan.doorways.filter((d) => d.a === roomA.id || d.b === roomA.id).length
    const after = shut.doorways.filter((d) => d.a === roomA.id || d.b === roomA.id).length
    expect(before).toBeGreaterThan(0)
    expect(after).toBe(0)

    // And the wall is back across the opening, so it stops the visitor too.
    // Measured as length rather than as a count: a doorway splits one wall
    // into two segments, so closing it makes the list shorter and the wall
    // longer, which is the whole point.
    const run = (walls: typeof plan.walls) =>
      walls
        .filter((wall) => wall.spaceId === roomA.id && !wall.structureId)
        .reduce((total, wall) => total + Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]), 0)
    expect(run(shut.walls)).toBeGreaterThan(run(plan.walls))
  })

  it('leaves the rest of the deck exactly as it was', () => {
    const plan = ship.plans.get(roomA.tierId)!
    expect(planSealed(ship, plan, [])).toBe(plan)
    expect(planSealed(ship, plan, ['a-room-on-another-deck'])).toBe(plan)
  })

  it('refuses to chain a room no technique is holding, and takes one that is', () => {
    expect(door(EMPTY_WORLD, 'chain-bind', roomA.id).report).toMatchObject({ kind: 'jail-refused' })
    const watched = door(EMPTY_WORLD, 'paper-spy', roomA.id).world
    const jailed = door(watched, 'chain-bind', roomA.id)
    expect(jailed.report).toMatchObject({ kind: 'jailed', spaceId: roomA.id })
    expect(jailed.world.shut).toEqual([roomA.id])
  })

  it('refuses the stair out of a shut room as well as the door', () => {
    const world = { ...EMPTY_WORLD, shut: [roomA.id] }
    expect(linkIsOpen(world, roomA.id)).toBe(false)
    expect(linkIsOpen(world, roomB.id)).toBe(true)
    expect(linkIsOpen(EMPTY_WORLD, roomA.id)).toBe(true)
  })
})

describe('what waits at a threshold', () => {
  it('expels an intruder back where they came from, and does not injure them', () => {
    const world = door(EMPTY_WORLD, 'legal-defense', roomA.id).world
    const arrival = arriveInTour({ ...world, cameFrom: roomB.id }, ship, roomA.id)
    expect(arrival.travelTo).toBe(roomB.id)
    expect(arrival.report).toMatchObject({ kind: 'expelled', spaceId: roomA.id })
    expect(arrival.punished).toBeFalsy()
  })

  it('lets the double take one punishment, and only one', () => {
    let world = door(EMPTY_WORLD, 'legal-defense', roomA.id).world
    world = door(world, 'guardian', roomB.id).world

    const first = arriveInTour({ ...world, cameFrom: roomB.id }, ship, roomA.id)
    expect(first.travelTo).toBeUndefined()
    expect(first.report).toMatchObject({ kind: 'double-spent' })
    expect(first.world.double).toBeNull()

    const second = arriveInTour({ ...first.world, cameFrom: roomB.id }, ship, roomA.id)
    expect(second.travelTo).toBe(roomB.id)
  })

  it('punishes the vow only when the rule is actually broken', () => {
    const world = door(EMPTY_WORLD, 'heart-vow', roomA.id).world
    expect(arriveInTour({ ...world, cameFrom: roomB.id }, ship, roomB.id).punished).toBeFalsy()
    const broken = arriveInTour({ ...world, cameFrom: roomB.id }, ship, roomA.id)
    expect(broken.punished).toBe(true)
    expect(broken.report).toMatchObject({ kind: 'vow-broken' })
  })

  it('closes the contract on its terms, and releases what was shut', () => {
    let world = door(EMPTY_WORLD, 'legal-defense', roomB.id).world
    world = door(world, 'paper-spy', roomB.id).world
    world = door(world, 'chain-bind', roomB.id).world
    world = door(world, 'contract', roomA.id).world

    const met = arriveInTour({ ...world, cameFrom: roomB.id }, ship, roomA.id)
    if (met.report?.kind !== 'pact-met') throw new Error('unreachable')
    expect(met.report.released).toBe(2)
    expect(met.world.shut).toEqual([])
    expect(met.world.guarded).toEqual([])
  })

  it('holds the visitor where the yellow card found them, until it is dismissed', () => {
    const blue = door(EMPTY_WORLD, 'tribunal', roomA.id, roomA.id)
    expect(blue.report).toMatchObject({ kind: 'card-blue' })
    const yellow = door(blue.world, 'tribunal', roomA.id, roomA.id)
    expect(yellow.world.pinned).toBe(roomA.id)

    const leaving = arriveInTour({ ...yellow.world, cameFrom: roomA.id }, ship, roomB.id)
    expect(leaving.travelTo).toBe(roomA.id)
    expect(leaving.report).toMatchObject({ kind: 'held-fast' })

    const red = door(yellow.world, 'tribunal', roomA.id, roomA.id)
    expect(red.world.pinned).toBeNull()
    expect(red.world.shut).toContain(roomA.id)
  })

  it('materializes the bait, and closes once it is taken', () => {
    const trap = door(EMPTY_WORLD, 'desire-trap', roomA.id, busiest.space.id)
    expect(trap.world.copies).toHaveLength(1)
    expect(trap.world.copies[0].spaceId).toBe(roomA.id)
    const taken = arriveInTour({ ...trap.world, cameFrom: roomB.id }, ship, roomA.id)
    expect(taken.report).toMatchObject({ kind: 'trapped' })
    expect(taken.world.pinned).toBe(roomA.id)
  })

  it('lets the fish take one thing each time the room is walked out of', () => {
    let world = door(EMPTY_WORLD, 'paper-spy', busiest.space.id).world
    world = door(world, 'chain-bind', busiest.space.id).world
    const loosed = door(world, 'devour', busiest.space.id)
    expect(loosed.report).toMatchObject({ kind: 'fish-loosed' })

    // Nothing at all while the visitor is inside.
    const inside = arriveInTour({ ...loosed.world, cameFrom: null }, ship, busiest.space.id)
    expect(inside.report?.kind).not.toBe('fish-fed')

    const out = arriveInTour({ ...loosed.world, cameFrom: busiest.space.id }, ship, roomB.id)
    expect(out.report).toMatchObject({ kind: 'fish-fed' })
    expect(Object.values(out.world.solids).filter((hold) => hold.gone)).toHaveLength(1)
  })

  it('refuses to loose the fish anywhere but a closed room', () => {
    expect(door(EMPTY_WORLD, 'devour', roomA.id).report).toMatchObject({ kind: 'jail-refused' })
  })
})

describe("Fugetsu's tunnel", () => {
  it('opens on the second end and collapses on the third crossing', () => {
    const set = door(EMPTY_WORLD, 'portal', roomA.id)
    expect(set.report).toMatchObject({ kind: 'worm-set' })
    let world = door(set.world, 'portal', roomB.id).world
    expect(world.worm).toMatchObject({ a: roomA.id, b: roomB.id, crossings: 0 })

    const first = wormExit(world, roomA.id, null)!
    expect(first.to).toBe(roomB.id)
    world = first.world
    const second = wormExit(world, roomA.id, null)!
    world = second.world
    const third = wormExit(world, roomA.id, null)!
    expect(third.report).toEqual({ kind: 'worm-spent' })
    expect(third.world.worm).toBeNull()
  })

  it('does nothing for someone walking past, or just delivered', () => {
    const world = { ...EMPTY_WORLD, worm: { a: roomA.id, b: roomB.id, crossings: 0 } }
    expect(wormExit(world, roomA.id, roomA.id)).toBeNull()
    expect(wormExit(world, busiest.space.id, null)).toBeNull()
    expect(wormExit({ ...EMPTY_WORLD, worm: { a: roomA.id, b: '', crossings: 0 } }, roomA.id, null)).toBeNull()
  })
})

describe('Silent Majority', () => {
  it('takes the ten rooms nearest the visitor, and remembers whether it fed', () => {
    const loosed = castInTour(EMPTY_WORLD, 'snakes', {
      ship,
      targetId: roomA.id,
      standingIn: roomA.id,
      at: [0, 0],
    })
    expect(loosed.world.snakes?.rooms).toHaveLength(10)
    expect(loosed.world.snakes?.fed).toBe(false)

    const victim = loosed.world.snakes!.rooms[3]
    const fed = arriveInTour({ ...loosed.world, cameFrom: null }, ship, victim)
    expect(fed.world.snakes?.fed).toBe(true)
    expect(fed.report).toMatchObject({ kind: 'snakes-fed' })
  })
})

// ── The body ──────────────────────────────────────────────────────────────

const on = (
  world: TourWorld,
  kind: Parameters<typeof castInTour>[1],
  extra: Partial<Parameters<typeof castInTour>[2]> = {},
) =>
  castInTour(world, kind, {
    ship,
    targetId: busiest.space.id,
    standingIn: busiest.space.id,
    at: centreOf(busiest.space),
    ...extra,
  })

describe('what the techniques make of the visitor', () => {
  it('buys speed and reach with the aura committed, and stops buying', () => {
    let world = EMPTY_WORLD
    expect(paceOf(world.body)).toBe(1)
    for (let cast = 0; cast < 9; cast++) world = on(world, 'enhance').world
    expect(world.body.enhance).toBe(6)
    expect(paceOf(world.body)).toBeGreaterThan(1)
    expect(reachOf(world.body)).toBeGreaterThan(reachOf(RESTING_BODY))
  })

  it('changes the height of the eyes and leaves the walk its own', () => {
    // The ring starts on the visitor's own body, which is where it belongs.
    const child = on(EMPTY_WORLD, 'transformation')
    expect(eyesOf(child.world.body)).toBeCloseTo(0.95)
    const tall = on(child.world, 'transformation')
    expect(eyesOf(tall.world.body)).toBeCloseTo(3.4)
    const own = on(tall.world, 'transformation')
    expect(own.world.body.eyes).toBeNull()
    expect(eyesOf(own.world.body)).toBe(1.7)
  })

  it('carries five and no more, and sets them down where it stops', () => {
    let world = on(EMPTY_WORLD, 'vehicle').world
    expect(world.body.riding).toBe(true)

    // Kurton's own technique loads what it is aimed at, and so does anything
    // else aimed at a solid while he is being ridden.
    const room = ship.structures.filter((solid) => solid.spaceId === busiest.space.id)
    world = on(world, 'vehicle', { targetSolidId: room[0].id }).world
    expect(world.body.passengers).toEqual([room[0].id])
    for (const solid of room.slice(1, CAPACITY)) {
      world = on(world, 'impact', { targetSolidId: solid.id }).world
    }
    expect(world.body.passengers).toHaveLength(CAPACITY)
    expect(on(world, 'impact', { targetSolidId: room[CAPACITY].id }).report).toEqual({
      kind: 'hold-full',
    })

    // Carried is not walked around: a passenger stops being an obstacle.
    expect(
      solidWalls(ship, world, busiest.space.tierId).some((wall) =>
        world.body.passengers.includes(wall.structureId ?? ''),
      ),
    ).toBe(false)

    // Aimed at nothing, the same technique is the one that lets you off.
    const down = on(world, 'vehicle', { standingIn: elsewhere.id, targetSolidId: null })
    expect(down.report).toMatchObject({ kind: 'alighted', passengers: CAPACITY })
    expect(down.world.body.passengers).toEqual([])
  })

  it('rides the passengers around the vehicle rather than where they were picked up', () => {
    let world = on(EMPTY_WORLD, 'vehicle').world
    const solid = ship.structures.find((s) => s.spaceId === busiest.space.id)!
    world = on(world, 'impact', { targetSolidId: solid.id }).world

    const parked = detachedOn(ship, world, busiest.space.tierId)[0].structure.at
    const carried = detachedOn(ship, world, busiest.space.tierId, 0, [999, 999])[0].structure.at
    expect(parked).not.toEqual(carried)
  })
})

describe('leaving the body behind', () => {
  it('goes on without it, and comes back to it', () => {
    const gone = on(EMPTY_WORLD, 'projection')
    expect(gone.world.body.projected?.spaceId).toBe(busiest.space.id)
    expect(walksThroughWalls(gone.world)).toBe(true)
    const back = on(gone.world, 'projection')
    expect(back.world.body.projected).toBeNull()
    expect(walksThroughWalls(back.world)).toBe(false)
  })

  it('is pulled back the moment the body is disturbed', () => {
    const gone = on(EMPTY_WORLD, 'projection').world
    const shut = { ...gone, shut: [busiest.space.id] }
    const next = on(shut, 'enhance')
    expect(next.report).toMatchObject({ kind: 'body-disturbed', spaceId: busiest.space.id })
    expect(next.travelTo).toBe(busiest.space.id)
    expect(next.world.body.projected).toBeNull()
  })
})

describe('the music, the chain and the deduction', () => {
  it('needs the prologue before it can take a shape, and gives it back', () => {
    const solid = ship.structures.find((s) => s.spaceId === busiest.space.id)!
    expect(on(EMPTY_WORLD, 'mimicry', { targetSolidId: solid.id }).report).toEqual({
      kind: 'dance-needed',
    })
    const playing = on(EMPTY_WORLD, 'rhythm').world
    const worn = on(playing, 'mimicry', { targetSolidId: solid.id })
    expect(worn.world.body.mimic).toBe(solid.id)
    expect(worn.world.body.eyes).toBeGreaterThan(0)
    expect(on(worn.world, 'mimicry').world.body.mimic).toBeNull()
  })

  it('opens the three senses the monkeys sealed, and holds them open', () => {
    const sealed = { ...EMPTY_WORLD, sealed: 2 }
    const soothed = on(sealed, 'melody')
    expect(soothed.world.sealed).toBe(0)
    expect(soothed.world.body.soothed).toBe(true)
    expect(soothed.report).toEqual({ kind: 'soothed', opened: true })
  })

  it('mends what was crushed in the room, and the whole ship under Emperor Time', () => {
    const solids = ship.structures.filter((s) => s.spaceId === busiest.space.id)
    let world = on(EMPTY_WORLD, 'impact', { targetSolidId: solids[0].id }).world
    world = on(world, 'impact', { targetSolidId: solids[1].id }).world
    const far = ship.structures.find((s) => s.spaceId !== busiest.space.id)!
    world = on(world, 'impact', { targetSolidId: far.id }).world

    const here = on(world, 'healing')
    if (here.report.kind !== 'mended') throw new Error('unreachable')
    expect(here.report.solids).toBe(2)
    expect(here.world.solids[far.id]).toBeDefined()

    const everywhere = on({ ...world, laidOpen: true }, 'healing')
    if (everywhere.report.kind !== 'mended') throw new Error('unreachable')
    expect(everywhere.report.solids).toBe(3)
  })

  it('gets stronger by naming a hold it has not named before, and runs out', () => {
    let world = on(EMPTY_WORLD, 'paper-spy').world
    world = on(world, 'room-isolation').world

    const first = on(world, 'predator')
    if (first.report.kind !== 'deduced') throw new Error('unreachable')
    expect(first.report.strength).toBe(1)
    expect(first.world.body.enhance).toBe(1)

    const second = on(first.world, 'predator')
    expect(second.report).toMatchObject({ kind: 'deduced', strength: 2 })
    // Two holds named, and the third cast has nothing left to name.
    expect(on(second.world, 'predator').report).toEqual({ kind: 'nothing-to-deduce' })
  })

  it('rests the exhaustion the walk wrote down', () => {
    let world = on(EMPTY_WORLD, 'enhance').world
    world = on(world, 'rhythm').world
    world = { ...world, worm: { a: 'a', b: 'b', crossings: 2 } }

    const rested = on(world, 'restoration')
    expect(rested.world.body.enhance).toBe(0)
    expect(rested.world.body.dance).toBe(0)
    expect(rested.world.worm?.crossings).toBe(0)
  })
})

function centreOf(space: { footprint: readonly (readonly [number, number])[] }): [number, number] {
  const sum = space.footprint.reduce<[number, number]>((t, p) => [t[0] + p[0], t[1] + p[1]], [0, 0])
  return [sum[0] / space.footprint.length, sum[1] / space.footprint.length]
}

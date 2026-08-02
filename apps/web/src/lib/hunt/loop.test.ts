/**
 * The loop, tested as a whole game rather than a tick.
 *
 * The questions worth asking here are the ones no single module can answer: does
 * the hunter ever learn something he was not told (I5), does an entrave laid
 * early still matter at the moment of contact (the step-4 question), and does
 * the hunter's reservoir actually fall as he searches (T4.4).
 */
import { describe, it, expect } from 'vitest'
import { buildArena } from './arena'
import { buildNavGraph } from './navmesh'
import { HUNT_DT, updateHunt, type HuntWorld } from './loop'
import { huntReducer, initialHuntState, type HuntState } from './state'
import { interiorPoint } from '../tour/geometry'
import { GAME_LENGTH, playerWon } from './outcome'

const arena = buildArena()
const graph = buildNavGraph(arena)
const world: HuntWorld = { dt: HUNT_DT, arena, graph }

const rooms = arena.spaces.map((space) => space.id)
const centreOf = (id: string) => interiorPoint(arena.spaces.find((s) => s.id === id)!.footprint)

function game(playerRoom = rooms[0], hunterRoom = rooms[rooms.length - 1]): HuntState {
  return initialHuntState({
    playerAt: { position: centreOf(playerRoom), spaceId: playerRoom },
    hunterAt: { position: centreOf(hunterRoom), spaceId: hunterRoom },
    targetSpaceId: rooms[rooms.length - 1],
    seed: 7,
  })
}

/**
 * Both in the same room, a few metres apart — inside a sweep and inside
 * earshot, but well outside contact range, which two bodies on the same
 * waypoint are not.
 */
function sameRoom(gap = 6): HuntState {
  const state = game(rooms[0], rooms[0])
  const [x, z] = state.player.position
  return { ...state, hunter: { ...state.hunter, position: [x + gap, z] } }
}

/** Standing on top of the player: the tick a contact happens. */
function touching(state: HuntState): HuntState {
  return { ...state, hunter: { ...state.hunter, position: state.player.position } }
}

function run(state: HuntState, seconds: number): HuntState {
  let current = state
  const ticks = Math.round(seconds / HUNT_DT)
  for (let tick = 0; tick < ticks && current.outcome !== 'caught'; tick += 1) {
    current = updateHunt(current, world)
  }
  return current
}

describe('the loop', () => {
  it('advances its own clock and nothing else’s', () => {
    const after = run(game(), 1)
    expect(after.clock).toBeCloseTo(1, 3)
  })

  it('is deterministic: the same seed replays the same game', () => {
    const a = run(game(), 20)
    const b = run(game(), 20)
    expect(a.hunter.position).toEqual(b.hunter.position)
    expect(a.hunter.pool).toEqual(b.hunter.pool)
    expect(a.log).toEqual(b.log)
  })

  it('does not move the player: the tour walks the body', () => {
    const before = game()
    const after = run(before, 5)
    expect(after.player.position).toEqual(before.player.position)
  })
})

describe('regeneration', () => {
  it('gives aura back at a standstill only', () => {
    const spent = huntReducer(game(), { type: 'SWEEP' })
    const still = run(spent, 2)
    expect(still.ledger.pool.available).toBeGreaterThan(spent.ledger.pool.available)

    const walking = run(huntReducer(spent, { type: 'WALKED', player: { atRest: false } }), 2)
    expect(walking.ledger.pool.available).toBe(spent.ledger.pool.available)
  })

  it('will not climb back over aura that is laid down — invariant I2', () => {
    let state = huntReducer(game(), { type: 'LAY' })
    state = huntReducer(state, { type: 'SWEEP' })
    expect(state.ledger.pool.available).toBe(60)
    state = run(state, 60)
    expect(state.ledger.pool.available).toBe(75)
  })
})

describe('what the hunter is allowed to know — invariant I5', () => {
  it('never identifies a player in Zetsu, however often he sweeps', () => {
    // Zetsu is not invisibility: the body still displaces the field, so a sweep
    // that reaches it comes back with *something over there*. What it never
    // comes back with is a reading — so the belief is never sharp, and nothing
    // is ever written down as having been believed.
    let state = huntReducer(game(rooms[0], rooms[rooms.length - 1]), { type: 'ZETSU' })
    state = { ...state, player: { ...state.player, atRest: true } }
    const after = run(state, 120)
    expect(after.log.filter((event) => event.kind === 'believed')).toEqual([])
    expect(after.hunter.belief.sharp).toBe(false)
  })

  it('identifies the same player standing in Ten — which is what Zetsu buys', () => {
    const inTen = run(sameRoom(), 40)
    expect(inTen.log.some((event) => event.kind === 'believed')).toBe(true)
    expect(inTen.hunter.belief.sharp).toBe(true)

    const hidden = huntReducer(sameRoom(), { type: 'ZETSU' })
    const after = run({ ...hidden, player: { ...hidden.player, atRest: true } }, 40)
    expect(after.log.some((event) => event.kind === 'believed')).toBe(false)
  })

  it('finds a player who is standing in Ten inside the sweep', () => {
    const after = run(sameRoom(), 40)
    expect(after.log.some((event) => event.kind === 'believed')).toBe(true)
  })

  it('hears footsteps in the room he is in, and believes them without seeing', () => {
    let state = sameRoom()
    state = huntReducer(state, { type: 'ZETSU' })
    state = huntReducer(state, { type: 'WALKED', player: { atRest: false } })
    const after = run(state, 1)
    expect(after.hunter.belief.from).toBe('sound')
    expect(after.hunter.belief.sharp).toBe(false)
  })

  it('hears nothing from a room that is neither his nor next to his', () => {
    const apart = rooms.find((id) => !graph.edges.get(rooms[0])?.includes(id) && id !== rooms[0])
    if (!apart) return
    let state = game(rooms[0], apart)
    state = huntReducer(state, { type: 'ZETSU' })
    state = huntReducer(state, { type: 'WALKED', player: { atRest: false } })
    expect(run(state, 0.5).hunter.belief.from).toBeNull()
  })
})

describe('the hunter’s reservoir — T4.4', () => {
  it('falls as he looks, and the journal says what it went on', () => {
    const after = run(sameRoom(), 120)
    expect(after.hunter.pool.available).toBeLessThan(100)
    expect(after.log.some((event) => event.actor === 'hunter' && event.cost > 0)).toBe(true)
  })

  it('kills him on an ordinary entrave once his Ten no longer holds', () => {
    const state = {
      ...sameRoom(),
      hunter: { ...sameRoom().hunter, pool: { available: 0, committed: 0 }, held: 3 },
    }
    expect(updateHunt(state, world).outcome).toBe('eliminated')
  })

  it('does not let him breathe his way out of a hold', () => {
    const state = {
      ...sameRoom(),
      hunter: { ...sameRoom().hunter, pool: { available: 0, committed: 0 }, held: 3 },
    }
    expect(updateHunt(state, world).hunter.pool.available).toBe(0)
  })

  it('leaves him alive when he is held but not spent', () => {
    let state = game(rooms[0], rooms[rooms.length - 1])
    state = { ...state, hunter: { ...state.hunter, held: 3 } }
    expect(updateHunt(state, world).outcome).toBe('playing')
  })
})

describe('the junction', () => {
  it('opens the duel on contact, with the reservoirs the hunt left', () => {
    const spent = huntReducer(sameRoom(), { type: 'SWEEP' })
    const met = updateHunt(touching(spent), world)
    expect(met.outcome).toBe('contact')
    expect(met.duel).not.toBeNull()
    // Not a fixed hundred: the fifteen the sweep cost is still missing.
    expect(met.duel!.player.pool.available).toBeLessThan(90)
    expect(met.duel!.player.pool.available).toBe(met.ledger.pool.available)
    expect(met.duel!.hunter.pool.available).toBe(met.hunter.pool.available)
  })

  it('springs the entrave waiting in the room the contact happens in', () => {
    const laid = huntReducer(sameRoom(), { type: 'LAY' })
    const met = updateHunt(touching(laid), world)
    expect(met.duel!.hunter.held).toBeGreaterThan(0)
    expect(met.ledger.pool.committed).toBe(0)
  })

  it('opens a duel with an unhindered hunter when nothing was laid', () => {
    expect(updateHunt(touching(sameRoom()), world).duel!.hunter.held).toBe(0)
  })

  it('plays the duel out to an ending rather than sitting in it', () => {
    const finished = run(updateHunt(touching(sameRoom()), world), 200)
    expect(['caught', 'eliminated', 'playing']).toContain(finished.outcome)
    expect(finished.duel?.outcome ?? 'over').not.toBe('playing')
  })
})

describe('the endings', () => {
  it('stops at ten minutes', () => {
    const state = { ...game(rooms[0], rooms[rooms.length - 1]), clock: GAME_LENGTH - 0.5 }
    expect(run(state, 1).outcome).toBe('timeUp')
  })

  it('is won by reaching the marked room', () => {
    const state = game(rooms[0], rooms[rooms.length - 1])
    const arrived = huntReducer(state, {
      type: 'WALKED',
      player: { spaceId: state.targetSpaceId! },
    })
    expect(updateHunt(arrived, world).outcome).toBe('reached')
  })

  it('does not stop the ten minutes for the contact — invariant I4', () => {
    // The exploit this closes: a player who covers and never commits cannot be
    // hit, and the hunter cannot afford to keep throwing at them. With the clock
    // suspended for the duel that standoff was a win by attrition against an
    // intact hunter, which I4 forbids. With it running it is a game they spent
    // without reaching the room.
    const met = updateHunt(touching(sameRoom()), world)
    expect(met.duel).not.toBeNull()
    const late = run({ ...met, clock: GAME_LENGTH - 0.5 }, 1)
    expect(late.outcome).toBe('timeUp')
    expect(playerWon(late.outcome)).toBe(false)
  })

  it('does nothing more once it is over', () => {
    const over = { ...game(), outcome: 'timeUp' as const }
    expect(updateHunt(over, world)).toBe(over)
  })
})

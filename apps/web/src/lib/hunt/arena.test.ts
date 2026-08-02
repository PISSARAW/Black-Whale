import { describe, it, expect } from 'vitest'
import { ARENA_ROOM_COUNT, ARENA_TIER_ID, buildArena } from './arena'
import { theShip } from '../tour/blueprint'

describe('the arena', () => {
  const arena = buildArena()

  it('is the eight rooms of Tserriednich’s apartment', () => {
    expect(arena.tierId).toBe(ARENA_TIER_ID)
    expect(arena.spaces).toHaveLength(ARENA_ROOM_COUNT)
  })

  it('draws nothing the reconstruction does not attest — invariant I6', () => {
    for (const space of arena.spaces) expect(space.provenance).toBe('panel')
  })

  it('takes the geometry as the blueprint already derived it', () => {
    const plan = theShip().plans.get(ARENA_TIER_ID)!
    expect(arena.doorways.length).toBeGreaterThan(0)
    expect(arena.walls.length).toBeGreaterThan(0)
    // Selected, never authored: everything in the arena is in the plan.
    for (const door of arena.doorways) expect(plan.doorways).toContain(door)
    for (const wall of arena.walls) expect(plan.walls).toContain(wall)
  })

  it('is contiguous — every room is reachable from every other', () => {
    const reached = new Set<string>([arena.spaces[0].id])
    let grew = true
    while (grew) {
      grew = false
      for (const door of arena.doorways) {
        for (const [from, to] of [
          [door.a, door.b],
          [door.b, door.a],
        ]) {
          if (reached.has(from) && !reached.has(to)) {
            reached.add(to)
            grew = true
          }
        }
      }
    }
    expect(reached.size).toBe(ARENA_ROOM_COUNT)
  })

  it('is bounded by the apartment’s own hull, so the edge needs no invisible wall', () => {
    // The arena is the whole of its tier: there is nowhere on this deck to walk
    // off it, which is what settles the open question of what the boundary is.
    const plan = theShip().plans.get(ARENA_TIER_ID)!
    expect(plan.spaces).toHaveLength(ARENA_ROOM_COUNT)
  })

  it('keeps the jambs of the doorways it kept', () => {
    const keys = new Set(arena.doorways.map((door) => [door.a, door.b].sort().join('|')))
    for (const wall of arena.walls) {
      if (wall.jambOf) expect(keys.has(wall.jambOf)).toBe(true)
    }
  })
})

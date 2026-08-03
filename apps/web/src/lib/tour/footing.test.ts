import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { CARPET, CARPET_ELEVATION, GRATING, PLATE, STONE, footingOf } from './footing'
import type { SpaceCategory } from './types'

const ship = buildShip()

/**
 * The floor, which the ear reads before the eye reads the room.
 *
 * What is checked is not that carpet is 380 Hz — that is a reading, and it will
 * be adjusted — but that the ship has more than one floor in it, that which one
 * you are on follows from the two facts the blueprint declares, and that no room
 * on board can end up without one.
 */
describe('what the deck is made of', () => {
  it('gives every category of room a floor', () => {
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const floor = footingOf(space.category, plan.tier.elevation)
        expect(floor, `${space.id} walks on nothing`).toBeDefined()
        expect(floor.level).toBeGreaterThan(0)
        expect(floor.band).toBeGreaterThan(0)
        expect(floor.decay).toBeGreaterThan(0)
      }
    }
  })

  it('is more than one floor, on a ship where it used to be one', () => {
    const found = new Set(
      [...ship.plans.values()].flatMap((plan) =>
        plan.spaces.map((space) => footingOf(space.category, plan.tier.elevation)),
      ),
    )
    expect(found.size).toBeGreaterThan(2)
  })

  it('carpets a stateroom high up and leaves the same room bare low down', () => {
    // The whole argument in one pair: the blueprint gives these two rooms the
    // same category and the same size, and the difference between them is not in
    // the drawing at all — it is that one of them was fitted out.
    expect(footingOf('quarters', CARPET_ELEVATION)).toBe(CARPET)
    expect(footingOf('quarters', CARPET_ELEVATION - 1)).toBe(PLATE)
  })

  it('rattles over the machinery and goes quiet on the carpet', () => {
    // The two ends of the ship, heard rather than seen: the grating is the
    // loudest and brightest thing underfoot and the carpet is the quietest and
    // the deadest, which is the class system again in the channel that carries it
    // faster than the picture does.
    expect(GRATING.level).toBeGreaterThan(CARPET.level * 2)
    expect(GRATING.band).toBeGreaterThan(CARPET.band)
    expect(CARPET.decay).toBeLessThan(GRATING.decay)
    // And stone is the one floor with a tail of its own before the room adds any.
    expect(STONE.decay).toBeGreaterThan(PLATE.decay)
  })

  it('falls back to bare plate rather than to silence', () => {
    // The categories are a union and this is not reachable through the type, but
    // the blueprint is hand-edited and a room with no floor would be a room a
    // visitor walks across in silence — which reads as the sound being broken.
    expect(footingOf('no-such-category' as SpaceCategory, 0)).toBe(PLATE)
  })
})

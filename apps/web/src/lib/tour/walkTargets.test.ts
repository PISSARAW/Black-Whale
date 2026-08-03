import { describe, expect, it } from 'vitest'
import { spaceForLocation, theShip } from './blueprint'
import { walkTargetsByLocation } from './walkTargets'

/**
 * The table is only worth anything if it answers exactly what the function it
 * replaces would have answered — the browser no longer has the blueprint to
 * check with, so this is the only place the two can be compared.
 */

const ship = theShip()
const targets = walkTargetsByLocation(ship)

describe('where the walk opens for a location on the map', () => {
  it('answers what spaceForLocation would have answered, for every slug it holds', () => {
    for (const [slug, spaceId] of Object.entries(targets)) {
      expect(spaceForLocation(ship, slug)?.id, slug).toBe(spaceId)
    }
  })

  it('holds every location the blueprint names, and their tails', () => {
    // The tail is what `/ship` actually looks up: the deck SVGs name a region
    // in their own vocabulary and the page resolves it to a catalogue id.
    for (const space of ship.blueprint.spaces) {
      if (!space.locationId) continue
      expect(targets[space.locationId], space.locationId).toBeTruthy()
      const tail = space.locationId.split('-').slice(1).join('-')
      if (tail) expect(targets[tail], tail).toBeTruthy()
    }
  })

  it('names a room that exists, never a dangling id', () => {
    for (const spaceId of Object.values(targets)) {
      expect(ship.spaces.get(spaceId), spaceId).toBeTruthy()
    }
  })

  it('stays small enough to send with the page', () => {
    // The whole point: a few hundred short strings instead of a 930 kB chunk.
    expect(JSON.stringify(targets).length).toBeLessThan(30_000)
  })
})

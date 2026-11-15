import { beforeEach, describe, expect, it } from 'vitest'

import { setListener } from '$lib/audio/space'

import { theShip } from './blueprint'
import { EMPTY_WORLD } from './hatsu'
import { placeOfReach, placeOfReport, rememberSoundWorld } from './soundPlace'

const ship = theShip()

describe('where a report happened', () => {
  beforeEach(() => {
    rememberSoundWorld(EMPTY_WORLD)
  })

  it('puts a cast on a room at that room', () => {
    const space = [...ship.spaces.values()][0]
    const place = placeOfReport({ kind: 'teleported', spaceId: space.id })

    expect(place?.spaceId).toBe(space.id)
    expect(place?.at).toHaveLength(2)
    expect(Number.isFinite(place?.at[0])).toBe(true)
  })

  it('puts a cast on a solid at the solid, not at the middle of its room', () => {
    const solid = ship.structures[0]
    const place = placeOfReport({ kind: 'crushed', solidId: solid.id })

    expect(place?.at).toEqual(solid.at)
    expect(place?.spaceId).toBe(solid.spaceId)
  })

  it('prefers the solid when a report names both', () => {
    const solid = ship.structures[0]
    const other = [...ship.spaces.values()].find((space) => space.id !== solid.spaceId)
    const place = placeOfReport({
      kind: 'coughed-up',
      solidId: solid.id,
      spaceId: other?.id ?? solid.spaceId,
      held: 1,
    })

    expect(place?.at).toEqual(solid.at)
  })

  it('places nothing for a cast that happened at the visitor', () => {
    expect(placeOfReport({ kind: 'phasing', on: true })).toBeNull()
    expect(placeOfReport({ kind: 'no-target' })).toBeNull()
  })

  it('places nothing for a room the blueprint does not have', () => {
    expect(placeOfReport({ kind: 'teleported', spaceId: 'nowhere' })).toBeNull()
  })
})

describe('where a cast at a body happened', () => {
  it('puts it down the reticle, in the room the visitor is in', () => {
    setListener({ at: [0, 0], heading: 0, pitch: 0, spaceId: 'hold' })
    const place = placeOfReach({ outcome: 'worn', kind: 'disguise', characterId: 'hisoka' })

    // Heading zero looks along −z in the walk's convention, so a body in front
    // of the visitor is at a lower `z` than they are.
    expect(place?.at[0]).toBeCloseTo(0)
    expect(place?.at[1]).toBeLessThan(0)
    expect(place?.spaceId).toBe('hold')
  })

  it('places nothing for a refusal, which made no sound to place', () => {
    expect(placeOfReach({ outcome: 'refused', kind: null, reason: 'no-target' })).toBeNull()
  })
})

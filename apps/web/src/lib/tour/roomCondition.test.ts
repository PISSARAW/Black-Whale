import { describe, expect, it } from 'vitest'

import { theShip } from './blueprint'
import { FINISH_CONDITION, finishOf, RoomConditionCache, roomConditionOf } from './roomCondition'
import type { Finish } from './roomAppearanceTypes'

const ship = theShip()
const at = (id: string) => {
  const space = ship.spaces.get(id)!
  const tier = ship.plans.get(space.tierId)!.tier
  return { space, tier }
}

describe('room condition', () => {
  it('answers every finish in the closed vocabulary', () => {
    expect(Object.keys(FINISH_CONDITION)).toHaveLength(37)
    for (const [finish, values] of Object.entries(FINISH_CONDITION)) {
      expect(finish as Finish).toBeTruthy()
      expect(values.absorption).toBeGreaterThan(0)
      expect(values.absorption).toBeLessThan(1)
    }
  })

  it('resolves detailed interior rooms through their catalogued parent finish', () => {
    expect(finishOf(at('tier-1-royal-residential-sector-room-1001-kitchen').space)).toBe(
      'royal-suite',
    )
    expect(finishOf(at('tier-2-heilly-secret-hideout-laundry').space)).toBe('concealed')
  })

  it('makes a royal suite cleaner, steadier and more absorbent than a hold bay', () => {
    const suite = roomConditionOf(at('tier-1-royal-residential-sector-room-1001-kitchen'))
    const bay = roomConditionOf(at('tier-5-area-37564'))

    expect(suite.wear).toBeLessThan(bay.wear)
    expect(suite.soil).toBeLessThan(bay.soil)
    expect(suite.ventilationStability).toBeGreaterThan(bay.ventilationStability)
    expect(suite.absorption).toBeGreaterThan(bay.absorption)
  })

  it('lets named canonical occupants raise pressure without becoming its baseline', () => {
    const room = at('tier-3-residential-room-3101')
    const empty = roomConditionOf(room)
    const occupied = roomConditionOf({ ...room, namedOccupants: 4 })
    expect(occupied.humanDensity).toBeGreaterThan(empty.humanDensity)
  })

  it('reuses a room condition until its named occupancy changes', () => {
    const room = at('tier-3-residential-room-3101')
    const cache = new RoomConditionCache()
    const empty = cache.get(room.space, room.tier)

    expect(cache.get(room.space, room.tier)).toBe(empty)
    expect(cache.get(room.space, room.tier, 4)).not.toBe(empty)
  })

  it('keeps every normalized output bounded', () => {
    for (const space of ship.spaces.values()) {
      const tier = ship.plans.get(space.tierId)!.tier
      const condition = roomConditionOf({ space, tier, namedOccupants: 50 })
      for (const key of [
        'wear',
        'soil',
        'airLoad',
        'humanDensity',
        'ventilationStability',
      ] as const) {
        expect(condition[key]).toBeGreaterThanOrEqual(0)
        expect(condition[key]).toBeLessThanOrEqual(1)
      }
    }
  })
})

import { describe, expect, it } from 'vitest'

import { theShip } from './blueprint'
import { roomConditionOf } from './roomCondition'
import { heardNeighbourOf, roomSoundKindOf, roomSoundProfileOf } from './roomSound'

const ship = theShip()
const profile = (id: string) => {
  const space = ship.spaces.get(id)!
  const tier = ship.plans.get(space.tierId)!.tier
  return roomSoundProfileOf(space, roomConditionOf({ space, tier }))
}

describe('room sound signatures', () => {
  it('reads functions already named by the blueprint', () => {
    expect(profile('tier-1-royal-residential-sector-room-1001-kitchen').kind).toBe('kitchen')
    expect(profile('tier-2-heilly-secret-hideout-laundry').kind).toBe('laundry')
    expect(profile('tier-1-vip-casino').kind).toBe('casino')
    expect(profile('tier-3-central-hospital-clinic').kind).toBe('medical')
    expect(profile('tier-4-recycling-sewage-facilities').kind).toBe('recycling')
  })

  it('does not turn an arbitrary room into an authored function', () => {
    expect(roomSoundKindOf(ship.spaces.get('tier-1-main-corridor')!, 'royal-passage')).toBe('none')
  })

  it('keeps sparse drips on rooms whose source names drains or sewage', () => {
    expect(profile('tier-2-heilly-secret-hideout-processing').drip.level).toBeGreaterThan(0)
    expect(profile('tier-4-recycling-sewage-facilities').drip.level).toBeGreaterThan(0)
    expect(profile('tier-1-main-corridor').drip.level).toBe(0)
  })

  it('makes lower-deck ventilation rougher and the crowd bed stronger', () => {
    const royal = profile('tier-1-main-corridor')
    const hold = profile('tier-5-main-corridor')
    expect(hold.ventilation.wobble).toBeGreaterThan(royal.ventilation.wobble)
    expect(hold.crowd.level).toBeGreaterThan(royal.crowd.level)
  })

  it('chooses only a room behind a real doorway', () => {
    const space = ship.spaces.get('tier-2-heilly-secret-hideout-laundry')!
    const plan = ship.plans.get(space.tierId)!
    const heard = heardNeighbourOf({ plan, space, at: space.footprint[0] })
    expect(heard).not.toBeNull()
    expect(ship.adjacency.get(space.id)).toContain(heard!.spaceId)
  })
})

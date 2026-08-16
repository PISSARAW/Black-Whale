import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { appearanceOf, authoredStructureColourOf, hasAuthoredAppearance } from './roomAppearance'

const ship = buildShip()

describe('room appearance', () => {
  it.each([
    ['tier-1', 34],
    ['tier-2', 5],
    ['tier-3', 10],
    ['tier-4', 5],
    ['tier-5', 7],
  ])('gives every audited %s location a deliberate finish', (tier, count) => {
    const locations = new Set(
      ship.blueprint.spaces
        .map((space) => space.locationId)
        .filter((id): id is string => id?.startsWith(`${tier}-`) ?? false),
    )

    expect(locations.size).toBe(count)
    expect([...locations].filter((id) => !hasAuthoredAppearance(id))).toEqual([])
  })

  it('covers the complete 61-location appearance audit', () => {
    const locations = new Set(
      ship.blueprint.spaces
        .map((space) => space.locationId)
        .filter((id): id is string => id !== null),
    )

    expect(locations.size).toBe(61)
    expect([...locations].every(hasAuthoredAppearance)).toBe(true)
  })

  it('separates the main Tier 1 visual registers without adding geometry', () => {
    const ids = [
      'tier-1-banquet-hall',
      'tier-1-lifeboats',
      'tier-1-princes-burial-chamber',
      'tier-1-vip-casino',
      'tier-1-vip-jail',
    ]
    const appearances = ids.map((id) => {
      const space = ship.blueprint.spaces.find((candidate) => candidate.locationId === id)!
      const tier = ship.plans.get(space.tierId)!.tier
      return appearanceOf(space, tier)
    })

    expect(new Set(appearances.map((appearance) => appearance.floor)).size).toBe(ids.length)
    expect(new Set(appearances.map((appearance) => appearance.wall)).size).toBe(ids.length)
  })

  it('uses attested colours for writing surfaces without recolouring ordinary furniture', () => {
    const whiteboard = ship.structures.find((entry) => entry.id.endsWith('living-whiteboard-1'))!
    const sofa = ship.structures.find(
      (entry) => entry.id === 'tier-1-royal-residential-sector-room-1005-living-seat-04',
    )!
    const room = ship.spaces.get(whiteboard.spaceId)!
    const appearance = appearanceOf(room, ship.plans.get(room.tierId)!.tier)

    expect(authoredStructureColourOf(whiteboard, appearance)).toBe(0xf2f2ea)
    expect(authoredStructureColourOf(sofa, appearance)).toBe(appearance.fabric)
  })

  it('distinguishes Camilla’s carpeted salon from the rest of her apartment', () => {
    const salon = ship.spaces.get('tier-1-royal-residential-sector-room-1002-living')!
    const bedroom = ship.spaces.get('tier-1-royal-residential-sector-room-1002-bedroom')!
    const tier = ship.plans.get(salon.tierId)!.tier

    expect(appearanceOf(salon, tier).floor).toBe(0x553238)
    expect(appearanceOf(salon, tier).floor).not.toBe(appearanceOf(bedroom, tier).floor)
  })
})

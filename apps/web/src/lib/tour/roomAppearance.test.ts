import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { appearanceOf, hasAuthoredAppearance } from './roomAppearance'

const ship = buildShip()

describe('room appearance', () => {
  it.each([
    ['tier-1', 34],
    ['tier-2', 5],
  ])('gives every audited %s location a deliberate finish', (tier, count) => {
    const locations = new Set(
      ship.blueprint.spaces
        .map((space) => space.locationId)
        .filter((id): id is string => id?.startsWith(`${tier}-`) ?? false),
    )

    expect(locations.size).toBe(count)
    expect([...locations].filter((id) => !hasAuthoredAppearance(id))).toEqual([])
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
})

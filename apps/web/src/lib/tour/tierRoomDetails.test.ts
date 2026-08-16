import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'

const ship = buildShip()

const byLocation = (locationId: string) => {
  const spaces = new Set(
    ship.blueprint.spaces
      .filter((space) => space.locationId === locationId)
      .map((space) => space.id),
  )
  return ship.structures.filter((structure) => spaces.has(structure.spaceId))
}

describe('manga details outside the princely apartments', () => {
  it('keeps Queen Unma’s crib, mobile and formal salon on Tier 1', () => {
    const ids = byLocation('tier-1-queens-living-quarters-room-01').map(({ id }) => id)

    expect(ids).toEqual(
      expect.arrayContaining([
        'tier-1-queens-living-quarters-room-01-crib',
        'tier-1-queens-living-quarters-room-01-mobile',
        'tier-1-queens-living-quarters-room-01-armchair',
        'tier-1-queens-living-quarters-room-01-side-table-port',
        'tier-1-queens-living-quarters-room-01-side-table-starboard',
        'tier-1-queens-living-quarters-room-01-coffee-table',
        'tier-1-queens-living-quarters-room-01-painting-centre',
        'tier-1-queens-living-quarters-room-01-painting-starboard',
      ]),
    )
  })

  it('keeps the panel-shown bench and seal in the Tier 1 Supreme Court', () => {
    const details = byLocation('tier-1-supreme-court')
    const byId = new Map(details.map((detail) => [detail.id, detail]))

    expect(byId.get('tier-1-supreme-court-bench')?.provenance).toBe('panel')
    expect(byId.get('tier-1-supreme-court-seal')?.provenance).toBe('panel')
  })
})

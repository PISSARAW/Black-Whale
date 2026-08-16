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

  it('keeps Morena’s couch, television and two consoles distinct on Tier 2', () => {
    const details = new Map(
      byLocation('tier-2-heilly-secret-hideout').map((detail) => [detail.id, detail]),
    )

    expect(details.get('tier-2-heilly-secret-hideout-office-couch')?.provenance).toBe('panel')
    expect(details.get('tier-2-heilly-secret-hideout-console')?.colour).toBe(0x1c1d20)
    expect(details.get('tier-2-heilly-secret-hideout-famicom')?.colour).toBe(0xe5dfcf)
    expect(details.get('tier-2-heilly-secret-hideout-super-famicom')?.colour).toBe(0xbebfbd)
  })

  it('keeps room 3101’s stacked bunks and wall storage distinct on Tier 3', () => {
    const details = new Map(
      byLocation('tier-3-residential-room-3101').map((detail) => [detail.id, detail]),
    )

    expect(details.get('tier-3-residential-room-3101-bed')?.name).toBe('Bunk Bed')
    expect(details.get('tier-3-residential-room-3101-bed')?.height).toBe(2.15)
    expect(details.get('tier-3-residential-room-3101-bunk-ladder')?.kind).toBe('bars')
    expect(details.get('tier-3-residential-room-3101-wardrobe')?.size).toEqual([0.8, 1.4])
    expect(details.get('tier-3-residential-room-3101-drawers')?.height).toBe(0.9)
    expect(details.get('tier-3-residential-room-3101-shelves')?.height).toBe(2.1)

    for (const detail of details.values()) {
      if (detail.spaceId === 'tier-3-residential-room-3101-living') {
        expect(detail.provenance).toBe('panel')
      }
    }
  })

  it('keeps the pale briefing boards and fifteen chairs shown on Tier 4', () => {
    const details = byLocation('tier-4-royal-army-conference-room')
    const byId = new Map(details.map((detail) => [detail.id, detail]))
    const chairs = details.filter((detail) => detail.id.includes('-chair-'))

    expect(chairs).toHaveLength(15)
    expect(chairs.every((chair) => chair.kind === 'seat' && chair.provenance === 'panel')).toBe(
      true,
    )
    expect(byId.get('tier-4-royal-army-conference-room-floor-screen')?.colour).toBe(0xe8e6df)
    expect(byId.get('tier-4-royal-army-conference-room-floor-chart-board')?.colour).toBe(0xd8d7d2)
  })

  it('keeps the Cha-R emblem, unlike doors, bunks and dark monitors on Tier 5', () => {
    const details = new Map(
      byLocation('tier-5-cha-r-family-office').map((detail) => [detail.id, detail]),
    )

    expect(details.get('tier-5-cha-r-family-office-logo')?.colour).toBe(0x1c1d20)
    expect(details.get('tier-5-cha-r-family-office-monitor-bank')?.colour).toBe(0x1c1d20)
    expect(details.get('tier-5-cha-r-family-office-strongbox')?.name).toBe(
      'Treasure-Chest Metal Door',
    )
    expect(details.get('tier-5-cha-r-family-office-robot-door')?.provenance).toBe('panel')
    expect(details.get('tier-5-cha-r-family-office-wooden-door')?.provenance).toBe('panel')
    expect(details.get('tier-5-cha-r-family-office-bed')?.height).toBe(2.15)
    expect(details.get('tier-5-cha-r-family-office-bunk-02')?.height).toBe(2.15)
    expect(details.get('tier-5-cha-r-family-office-bookshelves')?.kind).toBe('cabinet')
  })
})

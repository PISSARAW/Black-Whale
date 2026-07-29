import { describe, expect, it } from 'vitest'
import locationCatalog from '../../../../../data/locations/locations.json'
import {
  blueprint,
  buildShip,
  ceilingOf,
  spaceAt,
  spawnFacing,
  spawnPoint,
  validateBlueprint,
} from './blueprint'
import { pointInPolygon } from './geometry'

const ship = buildShip()

describe('the ship blueprint', () => {
  it('satisfies every reconstruction invariant', () => {
    // Reported in full: a hand edit to a footprint usually breaks several
    // things at once, and one failure at a time is a slow way to find out.
    expect(validateBlueprint()).toEqual([])
  })

  it('reconstructs all five tiers', () => {
    expect(ship.tiers.map((tier) => tier.id)).toEqual([
      'tier-1',
      'tier-2',
      'tier-3',
      'tier-4',
      'tier-5',
    ])
  })

  it('stacks the tiers in the order the cross-section gives them', () => {
    const elevations = ship.tiers.map((tier) => tier.elevation)
    expect([...elevations].sort((a, b) => b - a)).toEqual(elevations)
  })

  it('opens at least one doorway on every deck', () => {
    for (const [tierId, plan] of ship.plans) {
      expect(plan.doorways.length, `${tierId} has no doorway`).toBeGreaterThan(0)
    }
  })

  it('walls in every space it draws', () => {
    for (const [tierId, plan] of ship.plans) {
      expect(plan.walls.length, `${tierId} has no walls`).toBeGreaterThan(plan.spaces.length)
    }
  })
})

describe('the link back to the catalogue', () => {
  const catalogIds = new Set((locationCatalog as Array<{ id: string }>).map((entry) => entry.id))

  it('only points at locations that exist', () => {
    const dangling = blueprint.spaces
      .filter((space) => space.locationId !== null && !catalogIds.has(space.locationId))
      .map((space) => `${space.id} → ${space.locationId}`)
    expect(dangling).toEqual([])
  })

  it('reconstructs every room the catalogue places aboard the ship', () => {
    // Tiers and the ship itself are containers, not rooms, and Zodiac HQ is
    // not aboard at all — none of them is something the visitor walks into.
    const containers = new Set([
      'black-whale-1',
      'zodiac-hq',
      'tier-1',
      'tier-2',
      'tier-3',
      'tier-4',
      'tier-5',
      'tier-1-queens-living-quarters',
      'tier-1-royal-residential-sector',
      'tier-3-political-ward',
    ])
    const reconstructed = new Set(
      blueprint.spaces.map((space) => space.locationId).filter(Boolean) as string[],
    )
    const missing = (locationCatalog as Array<{ id: string }>)
      .map((entry) => entry.id)
      .filter((id) => !containers.has(id) && !reconstructed.has(id))

    expect(missing).toEqual([])
  })

  it('marks as inferred everything the manga does not show', () => {
    for (const space of blueprint.spaces) {
      if (space.provenance !== 'inferred') continue
      expect(space.source, `${space.id} claims a source it should not have`).not.toMatch(/^Ch\./)
    }
  })

  it('sources every space it does claim as canon', () => {
    for (const space of blueprint.spaces) {
      if (space.provenance === 'inferred') continue
      expect(space.source.length, `${space.id} has no source`).toBeGreaterThan(8)
    }
  })
})

describe('placing the visitor', () => {
  it('spawns inside the space it was asked for', () => {
    for (const space of blueprint.spaces) {
      const point = spawnPoint(space)
      expect(pointInPolygon(point, space.footprint), `${space.id} spawns outside itself`).toBe(true)
    }
  })

  it('resolves a point back to the space it stands in', () => {
    const plan = ship.plans.get('tier-1')!
    const banquet = ship.spaces.get('tier-1-banquet-hall')!
    expect(spaceAt(plan, spawnPoint(banquet))?.id).toBe('tier-1-banquet-hall')
  })

  it('resolves nothing out beyond the hull', () => {
    expect(spaceAt(ship.plans.get('tier-1')!, [10_000, 10_000])).toBeNull()
  })
})

describe('ceilings', () => {
  it('falls back to the tier when a space does not set one', () => {
    const tier = ship.tiers.find((candidate) => candidate.id === 'tier-1')!
    const corridor = ship.spaces.get('tier-1-main-corridor')!
    expect(corridor.ceiling).toBeNull()
    expect(ceilingOf(corridor, tier)).toBe(tier.ceiling)
  })

  it('lets a hall stand taller than its deck', () => {
    const tier = ship.tiers.find((candidate) => candidate.id === 'tier-1')!
    const banquet = ship.spaces.get('tier-1-banquet-hall')!
    expect(ceilingOf(banquet, tier)).toBeGreaterThan(tier.ceiling)
  })
})

describe('spawnFacing', () => {
  const ship2 = buildShip()

  it('looks down the long axis of a hall, away from the near end', () => {
    const banquet = ship2.spaces.get('tier-1-banquet-hall')!
    const at = spawnPoint(banquet)
    const yaw = spawnFacing(banquet, at)

    // Step forward along the bearing and stay inside the room.
    const ahead: [number, number] = [at[0] - Math.sin(yaw) * 5, at[1] - Math.cos(yaw) * 5]
    expect(pointInPolygon(ahead, banquet.footprint)).toBe(true)
  })

  it('gives a bearing that keeps the visitor inside every space it is asked about', () => {
    for (const space of blueprint.spaces) {
      const at = spawnPoint(space)
      const yaw = spawnFacing(space, at)
      const ahead: [number, number] = [at[0] - Math.sin(yaw) * 0.5, at[1] - Math.cos(yaw) * 0.5]
      expect(pointInPolygon(ahead, space.footprint), `${space.id} faces a wall`).toBe(true)
    }
  })
})

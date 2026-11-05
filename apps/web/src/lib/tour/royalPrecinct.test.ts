import { describe, expect, it } from 'vitest'
import { blueprint, buildShip, spaceForLocation, validateBlueprint } from './blueprint'
import { longestSharedWall, polygonsOverlap, pointInPolygon } from './geometry'
import { anchorFor } from '$lib/components/map/projection/tierAnchors'

const ship = buildShip()
const room = (id: string) => ship.spaces.get(id)!
const bounds = (id: string) => {
  const points = room(id).footprint
  return {
    x0: Math.min(...points.map(([x]) => x)),
    x1: Math.max(...points.map(([x]) => x)),
    z0: Math.min(...points.map(([, z]) => z)),
    z1: Math.max(...points.map(([, z]) => z)),
  }
}

describe('Royal Precinct, compared with chapters 417–420', () => {
  it('keeps all fourteen apartments clear of the unnamed aft block', () => {
    const aft = room('tier-1-garrison-void')
    const passage = room('tier-1-aft-blank-approach')
    for (let n = 1001; n <= 1014; n += 1) {
      const apartment = room(`tier-1-royal-residential-sector-room-${n}`)
      expect(polygonsOverlap(apartment.footprint, aft.footprint), apartment.id).toBe(false)
      expect(polygonsOverlap(apartment.footprint, passage.footprint), apartment.id).toBe(false)
      expect(Math.max(...apartment.footprint.map(([x]) => x))).toBeLessThanOrEqual(
        bounds(passage.id).x0,
      )
    }
  })

  it('follows the chapter 418 three-route schematic at both ends of each gangway', () => {
    const a = bounds('tier-1-route-a-landing')
    const b = bounds('tier-1-route-b-landing')
    const c = bounds('tier-1-route-c-landing')
    expect(a.z1).toBeLessThan(0)
    expect(c.z0).toBeGreaterThan(0)
    expect(b.x0).toBeGreaterThan(Math.max(a.x1, c.x1))
    for (const letter of ['a', 'b', 'c']) {
      const source = letter === 'a' ? 'tier-2-tier-1-access' : `tier-2-tier-1-route-${letter}`
      const link = blueprint.links.find((link) => link.from === source)!
      expect(link.to).toBe(`tier-1-route-${letter}-landing`)
      expect(pointInPolygon(link.atTo!, room(link.to).footprint)).toBe(true)
    }
  })

  it('places the chapter 419 recreation hall beside the prince block and the VIP approach', () => {
    const hall = room('tier-1-vvip-recreation-hall')
    const entrance = room('tier-1-main-corridor')
    expect(hall.tierId).toBe('tier-1')
    expect(longestSharedWall(hall.footprint, entrance.footprint)).not.toBeNull()
    expect(bounds(hall.id).z1).toBeLessThan(bounds('tier-1-royal-residential-sector-room-1001').z0)
    const steps = blueprint.links.filter((link) => link.from === hall.id)
    expect(steps).toHaveLength(2)
    expect(steps.every((link) => link.to === 'tier-1-vvip-recreation-gallery')).toBe(true)
  })

  it('keeps marker anchors and apartment interior thresholds inside the new footprints', () => {
    for (let n = 1001; n <= 1014; n += 1) {
      const id = `tier-1-royal-residential-sector-room-${n}`
      const anchor = anchorFor('tier-1', id)!
      expect(
        pointInPolygon([(anchor.x - 500) * 0.35, (anchor.y - 300) * 0.35], room(id).footprint),
      ).toBe(true)
      const link = blueprint.links.find((link) => link.from === id)!
      expect(pointInPolygon(link.at, room(id).footprint)).toBe(true)
    }
    expect(spaceForLocation(ship, 'tier-1-vvip-recreation-hall')?.tierId).toBe('tier-1')
  })

  it('has no overlapping, unreachable or misplaced royal-deck spaces or thresholds', () => {
    const royal = new Set(ship.plans.get('tier-1')!.spaces.map(({ id }) => id))
    const issues = validateBlueprint().filter((issue) =>
      [...royal].some((id) => issue.split(': unreachable from ')[0]!.includes(id)),
    )
    expect(issues).toEqual([])
  })

  it('carries the chapter 420 SWAMP BALL machine into the walkthrough', () => {
    expect(
      blueprint.structures.find(({ id }) => id === 'tier-1-vip-casino-swamp-ball'),
    ).toMatchObject({
      spaceId: 'tier-1-vip-casino',
      name: 'SWAMP BALL',
    })
  })
})

import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { StairNavigator } from './StairNavigator'
import { SurfaceWalker } from './SurfaceWalker'
import type { Vec2 } from './types'

const ship = theShip()
const stairs = new StairNavigator(ship)

describe('automatic stair landings', () => {
  it('covers both ends of every non-retractable stair link', () => {
    expect(stairs.ends).toHaveLength(
      ship.links.filter(({ kind, retractable }) => kind === 'stair' && !retractable).length * 2,
    )
    for (const end of stairs.ends) {
      const direction = end.direction ?? [-1, 0]
      const length = Math.hypot(...direction)
      const from: Vec2 = [
        end.at[0] - (direction[0] / length) * 1.2,
        end.at[1] - (direction[1] / length) * 1.2,
      ]
      const result = stairs.cross({
        spaceId: end.spaceId,
        from,
        at: end.at,
        height: end.height ?? 0,
        enabled: true,
      })
      expect(result?.spaceId).toBe(end.to)
      expect(result?.arrival).toEqual(end.arrival)
      expect(
        stairs.cross({
          spaceId: end.spaceId,
          from: end.at,
          at: end.at,
          height: end.height ?? 0,
          enabled: true,
        }),
      ).toBeNull()
    }
  })

  it('can descend straight after arriving without bouncing while continuing onto the gallery', () => {
    const end = stairs.ends.find(
      ({ spaceId, at }) => spaceId === 'tier-1-vvip-recreation-gallery' && at[0] === 27.5,
    )!
    expect(
      stairs.cross({
        spaceId: end.spaceId,
        from: [27.5, -33],
        at: [27.5, -33.5],
        height: 130.8,
        enabled: true,
      }),
    ).toBeNull()
    expect(
      stairs.cross({
        spaceId: end.spaceId,
        from: [27.5, -33.4],
        at: [27.4, -33.4],
        height: 130.8,
        enabled: true,
      }),
    ).toBeNull()
    expect(
      stairs.cross({
        spaceId: end.spaceId,
        from: [27.4, -33.4],
        at: [27.5, -33.4],
        height: 130.8,
        enabled: true,
      })?.spaceId,
    ).toBe('tier-1-vvip-recreation-hall')
  })

  it('honours a sealed exit and requires the top of a physical flight before changing levels', () => {
    const end = stairs.ends.find(({ spaceId }) => spaceId === 'tier-1-vvip-recreation-hall')!
    const from: Vec2 = [end.at[0] + 1.2, end.at[1]]
    expect(
      stairs.cross({ spaceId: end.spaceId, from, at: end.at, height: 128, enabled: true }),
    ).toBeNull()
    expect(
      stairs.cross({ spaceId: end.spaceId, from, at: end.at, height: 130.8, enabled: false }),
    ).toBeNull()
    expect(
      stairs.cross({ spaceId: end.spaceId, from, at: end.at, height: 130.8, enabled: true })
        ?.spaceId,
    ).toBe('tier-1-vvip-recreation-gallery')
  })

  it.each([
    [30, 27.5],
    [52, 54.5],
  ])(
    'turns from recreation stair %s onto its gallery and returns at the top tread',
    (x, galleryX) => {
      const plan = ship.plans.get('tier-1')!
      const walker = new SurfaceWalker()
      const foot: Vec2 = [x, -27.3]
      const top = walker.move(plan, { from: foot, to: [x, -33.2], extras: [], ghost: false })
      expect(walker.floor(plan, top)).toBeCloseTo(130.8)
      const gallery = walker.move(plan, {
        from: top,
        to: [galleryX, -33.4],
        extras: [],
        ghost: false,
      })
      expect(gallery[0]).toBeCloseTo(galleryX)
      expect(gallery[1]).toBeCloseTo(-33.4)
      expect(walker.floor(plan, gallery)).toBeCloseTo(130.8)
      const up = stairs.cross({
        spaceId: 'tier-1-vvip-recreation-hall',
        from: top,
        at: gallery,
        height: walker.floor(plan, gallery),
        enabled: true,
      })!
      expect(up.spaceId).toBe('tier-1-vvip-recreation-gallery')
      const down = stairs.cross({
        spaceId: up.spaceId,
        from: [galleryX + Math.sign(galleryX - x) * 1.2, -33.4],
        at: gallery,
        height: 130.8,
        enabled: true,
      })!
      expect(down.spaceId).toBe('tier-1-vvip-recreation-hall')
      const at = down.arrival.at!
      walker.reset(plan, at, down.arrival.surfaceHeight)
      const lower = walker.move(plan, { from: at, to: foot, extras: [], ghost: false })
      expect(lower[0]).toBeCloseTo(foot[0])
      expect(lower[1]).toBeCloseTo(foot[1])
      expect(walker.floor(plan, lower)).toBe(128)
    },
  )
})

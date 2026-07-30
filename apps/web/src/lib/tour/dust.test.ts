import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import {
  DUST_MAX,
  DUST_MIN,
  DUST_MIN_HEIGHT,
  DUST_MIN_VOLUME,
  DUST_RISE,
  driftDust,
  dustCount,
  dustOf,
  holdsDust,
} from './dust'
import { pointInPolygon, polygonArea } from './geometry'

const ship = buildShip()

/** Every room of the ship with its deck, since the dust is a property of both. */
const rooms = [...ship.plans.values()].flatMap((plan) =>
  plan.spaces.map((space) => ({ space, tier: plan.tier })),
)

describe('which rooms hold dust', () => {
  it('asks for height and room, not one or the other', () => {
    const holding = rooms.filter(({ space, tier }) => holdsDust(space, tier))
    // The ten great voids of the ship, and they are the ten you would name: the
    // banquet hall, the screening room, the observation deck, the supreme court,
    // the central courthouse, the cineplex, both recycling plants, the Cha-R
    // warehouse and the suspension bay. 3 129 motes over all of them.
    expect(holding.map(({ space }) => space.id).sort()).toEqual([
      'tier-1-banquet-hall',
      'tier-1-supreme-court',
      'tier-2-screening-room',
      'tier-3-central-courthouse',
      'tier-3-cineplex',
      'tier-3-observation-deck',
      'tier-4-recycling-sewage-facilities',
      'tier-5-hull-suspension-bay',
      'tier-5-technical-recycling',
      'tier-5-warehouse',
    ])
    for (const { space, tier } of holding) {
      const ceiling = ceilingOf(space, tier)
      expect(ceiling).toBeGreaterThanOrEqual(DUST_MIN_HEIGHT)
      expect(polygonArea(space.footprint) * ceiling).toBeGreaterThanOrEqual(DUST_MIN_VOLUME)
    }
  })

  it('leaves out the eight-thousand-cubic-metre rooms you can touch the ceiling of', () => {
    // Tier 4's berthing is 8 000 m³ and more under 4,5 m of deckhead. Volume alone
    // would fill it with dust, and dust in a room that size is dirt on the lens.
    const berthing = rooms.find(({ space }) => space.id === 'tier-4-general-area-east')!
    expect(
      polygonArea(berthing.space.footprint) * ceilingOf(berthing.space, berthing.tier),
    ).toBeGreaterThan(DUST_MIN_VOLUME)
    expect(holdsDust(berthing.space, berthing.tier)).toBe(false)
    expect(dustOf(berthing.space, berthing.tier)).toBeNull()
  })

  it('gives a bigger void more motes, between its own two bounds', () => {
    expect(dustCount(DUST_MIN_VOLUME)).toBe(DUST_MIN)
    expect(dustCount(1_000_000)).toBe(DUST_MAX)
    expect(dustCount(24_000)).toBeGreaterThan(dustCount(12_000))
    for (const volume of [0, 8_000, 40_000, 65_856]) {
      expect(dustCount(volume)).toBeGreaterThanOrEqual(DUST_MIN)
      expect(dustCount(volume)).toBeLessThanOrEqual(DUST_MAX)
    }
  })
})

/**
 * Where the motes are allowed to be, which is the only thing about them that can
 * be wrong in a way a picture would not show.
 *
 * Dust hanging outside the hull is invisible from inside the room and unmistakable
 * from the deck below, and dust that walks out through a bulkhead over ten minutes
 * of standing still is a bug no screenshot can catch.
 */
describe('where the dust hangs', () => {
  const clouds = rooms
    .map(({ space, tier }) => ({ space, tier, dust: dustOf(space, tier) }))
    .filter((entry) => entry.dust !== null)

  it('samples every mote inside the room, and between its floor and deckhead', () => {
    for (const { space, dust } of clouds) {
      for (let i = 0; i < dust!.positions.length; i += 3) {
        const x = dust!.positions[i]
        const y = dust!.positions[i + 1]
        const z = dust!.positions[i + 2]
        expect(pointInPolygon([x, z], space.footprint), `${space.id} hangs dust in the hull`).toBe(
          true,
        )
        expect(y).toBeGreaterThanOrEqual(dust!.floorY)
        expect(y).toBeLessThanOrEqual(dust!.ceilingY)
      }
    }
  })

  it('keeps every mote in the room for a quarter of an hour of standing still', () => {
    for (const { space, dust } of clouds) {
      let elapsed = 0
      // 900 seconds at 30 Hz, which is longer than anyone stands in one room and
      // enough turns of the slowest sway to bring every mote round twice.
      for (let frame = 0; frame < 900 * 30; frame += 97) {
        elapsed = (frame / 30) * 1
        driftDust(dust!, 97 / 30, elapsed)
      }
      for (let i = 0; i < dust!.positions.length; i += 3) {
        expect(
          pointInPolygon([dust!.positions[i], dust!.positions[i + 2]], space.footprint),
          `${space.id} let a mote drift out of itself`,
        ).toBe(true)
        expect(dust!.positions[i + 1]).toBeGreaterThanOrEqual(dust!.floorY - 1e-4)
        expect(dust!.positions[i + 1]).toBeLessThanOrEqual(dust!.ceilingY + 1e-4)
      }
    }
  })

  it('encloses each cloud in the sphere it reports, so it can be culled', () => {
    for (const { space, dust } of clouds) {
      for (let i = 0; i < dust!.positions.length; i += 3) {
        const distance = Math.hypot(
          dust!.positions[i] - dust!.centre[0],
          dust!.positions[i + 1] - dust!.centre[1],
          dust!.positions[i + 2] - dust!.centre[2],
        )
        expect(distance, `${space.id} reports a sphere its dust is outside of`).toBeLessThanOrEqual(
          dust!.radius + 1e-3,
        )
      }
    }
  })
})

describe('how the dust moves', () => {
  const bay = ship.spaces.get('tier-5-hull-suspension-bay')!
  const tierOf = (id: string) => [...ship.plans.values()].find((plan) => plan.tier.id === id)!.tier
  const tier = tierOf(bay.tierId)

  it('rises, and puts a mote that reaches the deckhead back on the floor', () => {
    const dust = dustOf(bay, tier)!
    const before = dust.positions[1]
    driftDust(dust, 1, 1)
    expect(dust.positions[1] - before).toBeCloseTo(DUST_RISE, 5)

    // Twenty-one metres of rise at 6 cm a second is about six minutes; every mote
    // has wrapped several times by then and none has left the room.
    for (let second = 0; second < 1200; second++) driftDust(dust, 1, second)
    for (let i = 1; i < dust.positions.length; i += 3) {
      expect(dust.positions[i]).toBeGreaterThanOrEqual(dust.floorY - 1e-4)
      expect(dust.positions[i]).toBeLessThanOrEqual(dust.ceilingY + 1e-4)
    }
  })

  it('hangs the same dust for two visitors, and different dust in two rooms', () => {
    expect([...dustOf(bay, tier)!.positions]).toEqual([...dustOf(bay, tier)!.positions])
    const court = ship.spaces.get('tier-1-supreme-court')!
    expect([...dustOf(court, tierOf(court.tierId))!.positions.slice(0, 30)]).not.toEqual([
      ...dustOf(bay, tier)!.positions.slice(0, 30),
    ])
  })

  it('arrives in the same place at 30 Hz as at 144 Hz', () => {
    // The sway is a function of the walk's clock rather than of the last frame, so
    // two frame rates agree exactly rather than nearly — which is what lets the
    // bound on it be a bound and not a tendency.
    const slow = dustOf(bay, tier)!
    const fast = dustOf(bay, tier)!
    for (let frame = 1; frame <= 30 * 4; frame++) driftDust(slow, 1 / 30, frame / 30)
    for (let frame = 1; frame <= 144 * 4; frame++) driftDust(fast, 1 / 144, frame / 144)

    for (let i = 0; i < slow.positions.length; i += 3) {
      // The horizontal, which is computed from the clock: identical.
      expect(fast.positions[i]).toBeCloseTo(slow.positions[i], 4)
      expect(fast.positions[i + 2]).toBeCloseTo(slow.positions[i + 2], 4)
      // The vertical is integrated, so it agrees to the metre rather than exactly —
      // and it is a wrap, so a mote either side of the deckhead is metres apart.
      const drop = Math.abs(fast.positions[i + 1] - slow.positions[i + 1])
      expect(Math.min(drop, Math.abs(drop - (slow.ceilingY - slow.floorY)))).toBeLessThan(0.05)
    }
  })

  it('does nothing on a frame that took no time', () => {
    const dust = dustOf(bay, tier)!
    const before = [...dust.positions]
    driftDust(dust, 0, 12)
    expect([...dust.positions]).toEqual(before)
  })
})

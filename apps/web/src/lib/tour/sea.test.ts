import { describe, expect, it } from 'vitest'

import { buildShip } from './blueprint'
import { SEA_DECKS, WATERLINE, seaOffset, seaOutside, submerged } from './sea'

/**
 * The sea is a canon claim before it is a mix decision, so the first three tests
 * read the blueprint rather than the table: the waterline has to be a deck the
 * ship actually has, Tier 5 has to come out submerged, and everything else has
 * to come out dry. If a re-measured deck plan ever moves Tier 4, these fail
 * before the sound does.
 */
describe('where the water is', () => {
  const ship = buildShip()
  const elevationOf = (id: string) => ship.tiers.find((tier) => tier.id === id)?.elevation

  it('stands at the elevation of Tier 4, which is the first deck the canon leaves dry', () => {
    expect(elevationOf('tier-4')).toBe(WATERLINE)
  })

  it('puts the whole of Tier 5 under the water and nothing else', () => {
    for (const tier of ship.tiers) {
      if (tier.kind !== 'deck') continue
      const under = tier.id.startsWith('tier-5')
      expect(submerged(tier.elevation), `${tier.id} at ${tier.elevation} m`).toBe(under)
    }
  })

  it('is over the visitor in the hold and under them in the King rooms', () => {
    expect(seaOffset(0)).toBeGreaterThan(0)
    expect(seaOffset(128)).toBeLessThan(0)
    // And it crosses exactly once, at the waterline itself.
    expect(seaOffset(WATERLINE)).toBe(0)
  })
})

describe('what is left of the sea at each deck', () => {
  it('gives each deck of the table exactly what the table says', () => {
    for (const deck of SEA_DECKS) {
      const heard = seaOutside(deck.elevation)
      expect(heard.level, `${deck.elevation} m is mixed wrong`).toBeCloseTo(deck.level, 10)
      expect(heard.cutoff, `${deck.elevation} m is filtered wrong`).toBeCloseTo(deck.cutoff, 10)
    }
  })

  it('is loudest at the waterline and quieter in both directions away from it', () => {
    const surface = seaOutside(WATERLINE).level
    expect(surface).toBeGreaterThan(seaOutside(0).level)
    expect(surface).toBeGreaterThan(seaOutside(63).level)
    expect(seaOutside(63).level).toBeGreaterThan(seaOutside(128).level)
  })

  it('gets brighter with every deck climbed, because the path stops being water', () => {
    let last = seaOutside(-10)
    for (let elevation = -10; elevation <= 148; elevation += 0.5) {
      const heard = seaOutside(elevation)
      expect(
        heard.cutoff,
        `${elevation} m is duller than the deck below it`,
      ).toBeGreaterThanOrEqual(last.cutoff - 1e-12)
      last = heard
    }
  })

  it('interpolates between two decks and stays flat outside the hull', () => {
    const between = seaOutside((SEA_DECKS[0].elevation + SEA_DECKS[1].elevation) / 2)
    expect(between.level).toBeCloseTo((SEA_DECKS[0].level + SEA_DECKS[1].level) / 2, 10)
    expect(between.cutoff).toBeCloseTo((SEA_DECKS[0].cutoff + SEA_DECKS[1].cutoff) / 2, 10)

    expect(seaOutside(-40)).toEqual(seaOutside(0))
    expect(seaOutside(400)).toEqual(seaOutside(128))
  })
})

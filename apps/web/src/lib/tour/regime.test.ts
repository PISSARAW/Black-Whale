import { describe, expect, it } from 'vitest'
import { REFERENCE_REGIME, regimeOf, type Regime } from './regime'
import { REFERENCE_HOUR, SHIP_HOURS } from './sky'

/**
 * What an hour is worth on a wall, as the renderer will actually compute it.
 *
 * `AmbientLight` multiplies its colour by its intensity and the deck multiplier
 * multiplies the result, so the level is the product of all three and never any
 * one of them. Every regression this file has caught has been a level hiding
 * inside something that looked like a hue — see the note on the palette.
 */
const luma = (c: readonly [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const level = (r: Regime) => luma(r.deck) * luma(r.ambient.colour) * r.ambient.intensity

/** How far a cast leans warm: positive is orange, negative is blue. */
const warmth = (r: Regime) => r.deck[0] * r.ambient.colour[0] - r.deck[2] * r.ambient.colour[2]

const HOURS = [SHIP_HOURS.morning, SHIP_HOURS.noon, SHIP_HOURS.evening, SHIP_HOURS.night]

describe('regimeOf', () => {
  it('lands exactly on the four hours the panel offers', () => {
    // Pressing a button has to hit the posed row rather than something near it,
    // or the palette the panel names is not the palette the visitor gets.
    expect(regimeOf(SHIP_HOURS.morning)).toBe(regimeOf(10))
    expect(regimeOf(SHIP_HOURS.noon)).toBe(REFERENCE_REGIME)
    expect(regimeOf(SHIP_HOURS.evening)).toBe(regimeOf(19.5))
    expect(regimeOf(SHIP_HOURS.night)).toEqual(regimeOf(3))
  })

  it('falls back to the hour ch. 380 draws, as the sky does', () => {
    expect(REFERENCE_REGIME).toBe(regimeOf(REFERENCE_HOUR))
  })

  it('keeps every hour within a few per cent of the same level', () => {
    // The whole point of the palette: four hours told apart by colour, not by
    // how much of the room you can see. The posed rows are computed to hit
    // their share exactly; a changeover between two of them can overshoot by a
    // couple of per cent, because interpolating a colour and an intensity
    // separately does not preserve their product. Two per cent of a stop is
    // nothing anyone can see, and holding it tighter would mean interpolating in
    // a space nobody picked these colours in.
    const day = level(regimeOf(REFERENCE_HOUR))
    for (let hour = 0; hour < 24; hour += 0.25) {
      const share = level(regimeOf(hour)) / day
      expect(share).toBeGreaterThan(0.85)
      expect(share).toBeLessThan(1.05)
    }
  })

  it('leaves the night lit, and only a little under the day', () => {
    const share = level(regimeOf(SHIP_HOURS.night)) / level(regimeOf(REFERENCE_HOUR))
    expect(share).toBeGreaterThan(0.85)
    expect(share).toBeLessThan(0.95)
  })

  it('puts the morning under a blue sky and the night under an orange one', () => {
    expect(warmth(regimeOf(SHIP_HOURS.morning))).toBeLessThan(0)
    expect(warmth(regimeOf(SHIP_HOURS.noon))).toBeGreaterThan(0)
    expect(warmth(regimeOf(SHIP_HOURS.evening))).toBeGreaterThan(
      warmth(regimeOf(SHIP_HOURS.noon)),
    )
    expect(warmth(regimeOf(SHIP_HOURS.night))).toBeGreaterThan(
      warmth(regimeOf(SHIP_HOURS.evening)),
    )
  })

  it('gives each of the four a cast no other one could be mistaken for', () => {
    const casts = HOURS.map((hour) => warmth(regimeOf(hour)))
    for (let i = 0; i + 1 < casts.length; i++) {
      expect(Math.abs(casts[i + 1]! - casts[i]!)).toBeGreaterThan(0.05)
    }
  })

  it('holds one flat night across the small hours', () => {
    expect(regimeOf(23.75)).toEqual(regimeOf(0.5))
    expect(regimeOf(2)).toEqual(regimeOf(4))
  })

  it('thickens the air and the dust as the day goes, and never the reverse', () => {
    expect(regimeOf(SHIP_HOURS.noon).motes).toBeLessThan(regimeOf(SHIP_HOURS.evening).motes)
    expect(regimeOf(SHIP_HOURS.evening).motes).toBeLessThan(regimeOf(SHIP_HOURS.night).motes)
    expect(regimeOf(SHIP_HOURS.noon).air.density).toBeLessThan(
      regimeOf(SHIP_HOURS.night).air.density,
    )
  })

  it('moves continuously, including across midnight', () => {
    let previous = regimeOf(0)
    for (let hour = 0.05; hour <= 24; hour += 0.05) {
      const next = regimeOf(hour % 24)
      expect(Math.abs(next.deck[0] - previous.deck[0])).toBeLessThan(0.02)
      expect(Math.abs(next.ambient.intensity - previous.ambient.intensity)).toBeLessThan(0.05)
      previous = next
    }
  })

  it('reads the same at an hour and at that hour a day later', () => {
    expect(regimeOf(19.25)).toEqual(regimeOf(19.25 + 24))
    expect(regimeOf(3)).toEqual(regimeOf(3 - 24))
  })
})

import { describe, expect, it } from 'vitest'
import { GRADE_DEFAULTS } from './postGrade'
import { hex } from './light'
import { DAY_AIR, DAY_AMBIENT, DAY_AMBIENT_INTENSITY, REFERENCE_REGIME, regimeOf } from './regime'
import { REFERENCE_HOUR } from './sky'

describe('regimeOf', () => {
  it('is the identity at the hour ch. 380 draws', () => {
    const noon = regimeOf(REFERENCE_HOUR)
    expect(noon.deck).toEqual([1, 1, 1])
    expect(noon.fitting).toEqual([1, 1, 1])
    expect(noon.exposure).toBe(1)
    expect(noon.motes).toBe(1)
    expect(noon.air.density).toBe(1)
  })

  it('leaves the tuned ambient, air and grade untouched at the reference', () => {
    const noon = regimeOf(REFERENCE_HOUR)
    expect(noon.ambient.colour).toEqual(hex(DAY_AMBIENT))
    expect(noon.ambient.intensity).toBe(DAY_AMBIENT_INTENSITY)
    expect(noon.air.colour).toEqual(hex(DAY_AIR))
    expect(noon.grade.contrast).toBe(GRADE_DEFAULTS.contrast)
    expect(noon.grade.saturation).toBe(GRADE_DEFAULTS.saturation)
    expect(noon.grade.vignette).toBe(GRADE_DEFAULTS.vignette)
  })

  it('hands the reference back for anything that wants no hour at all', () => {
    expect(REFERENCE_REGIME).toEqual(regimeOf(REFERENCE_HOUR))
  })

  it('turns the ship down on the night watch, and warms what is left', () => {
    const night = regimeOf(1)
    // The level is the ambient's job and `deck` only carries the cast — see the
    // note on `WATCH`. What the night owes is the *product*: about a stop down,
    // and nowhere near the two stops that stop the floor being drawn.
    const level = night.deck[0] * night.ambient.intensity
    const day = regimeOf(REFERENCE_HOUR)
    const full = day.deck[0] * day.ambient.intensity
    expect(level).toBeLessThan(full * 0.75)
    expect(level).toBeGreaterThan(full * 0.4)
    // Warmer than it is blue: that is the whole claim of a watch regime.
    expect(night.deck[0]).toBeGreaterThan(night.deck[2])
    expect(night.exposure).toBeLessThan(1)
    expect(night.air.density).toBeGreaterThan(1)
    expect(night.motes).toBeGreaterThan(1)
    expect(night.grade.vignette).toBeGreaterThan(GRADE_DEFAULTS.vignette)
  })

  it('holds one flat night across the small hours', () => {
    expect(regimeOf(23.5)).toEqual(regimeOf(0.5))
    expect(regimeOf(2)).toEqual(regimeOf(0))
  })

  it('gives the evening more colour than the day and less contrast', () => {
    const evening = regimeOf(18)
    expect(evening.grade.saturation).toBeGreaterThan(GRADE_DEFAULTS.saturation)
    expect(evening.grade.contrast).toBeLessThan(GRADE_DEFAULTS.contrast + 0.05)
    expect(evening.deck[0]).toBeGreaterThan(evening.deck[2])
  })

  it('never brightens a deck past its own day level', () => {
    for (let hour = 0; hour < 24; hour += 0.25) {
      const { deck, fitting } = regimeOf(hour)
      for (const channel of [...deck, ...fitting]) {
        expect(channel).toBeGreaterThan(0)
        expect(channel).toBeLessThanOrEqual(1.05)
      }
    }
  })

  it('moves continuously, including across midnight', () => {
    let previous = regimeOf(0)
    for (let hour = 0.05; hour <= 24; hour += 0.05) {
      const next = regimeOf(hour % 24)
      expect(Math.abs(next.deck[0] - previous.deck[0])).toBeLessThan(0.02)
      expect(Math.abs(next.exposure - previous.exposure)).toBeLessThan(0.01)
      previous = next
    }
  })

  it('reads the same at an hour and at that hour a day later', () => {
    expect(regimeOf(19.25)).toEqual(regimeOf(19.25 + 24))
    expect(regimeOf(3)).toEqual(regimeOf(3 - 24))
  })
})

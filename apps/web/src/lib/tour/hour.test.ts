import { describe, expect, it } from 'vitest'
import { NO_HOUR, shipHourOf } from './hour'

/**
 * The two rows of §3 that hand back an hour: canon printed a clock, or canon
 * stated a relation to one and the arithmetic followed. Both are hours, and the
 * `≈` that separates them belongs on the read-out rather than in the light.
 */
describe('shipHourOf', () => {
  it('takes the hour canon states', () => {
    // Chapter 374: Fugetsu's bedside clock, 37 h 30 out of port.
    const hour = shipHourOf({
      occurredAtBasis: 'stated',
      occurredAtHours: 37.5,
      occurredAtLabel: 'Day 3 · Tuesday · 01:27',
    })
    expect(hour).toEqual({ hours: 37.5, basis: 'stated', label: 'Day 3 · Tuesday · 01:27' })
  })

  it('takes a derived hour too — the arithmetic is sourced', () => {
    const hour = shipHourOf({
      occurredAtBasis: 'derived',
      occurredAtHours: 46.5,
      occurredAtLabel: '≈ Day 3 · 10:27',
    })
    expect(hour.hours).toBe(46.5)
    expect(hour.basis).toBe('derived')
  })

  /**
   * The whole point of the rule: an hour nobody knows is not an hour. `null` is
   * the instruction to draw the state ch. 380 draws, which is exactly what the
   * walk showed before any of this existed.
   */
  it('invents no hour for a bracketed event', () => {
    const hour = shipHourOf({
      occurredAtBasis: 'bracketed',
      occurredAtHours: null,
      occurredAtLabel: 'Day 4 – Day 8',
    })
    expect(hour.hours).toBeNull()
    // The label still crosses: the read-out is what makes the fallback legible
    // rather than silent.
    expect(hour.label).toBe('Day 4 – Day 8')
  })

  it('invents no hour for a day the canon dates without a clock', () => {
    // `bracket` widens a bare day to that day's bounds and leaves `hours` unset:
    // the basis says the day is sourced, the absent hour says the time inside it
    // is not.
    expect(shipHourOf({ occurredAtBasis: 'derived', occurredAtLabel: '≈ Day 5' }).hours).toBeNull()
  })

  it('says nothing at all about an event off the voyage clock', () => {
    expect(shipHourOf({})).toEqual(NO_HOUR)
    // A flashback carries the date of what it shows, and canon dates none of
    // them in voyage hours — so the columns are empty and so is this.
    expect(shipHourOf({ occurredAtBasis: null, occurredAtHours: null })).toEqual(NO_HOUR)
  })

  it('refuses a basis the columns should never hold', () => {
    const hour = shipHourOf({ occurredAtBasis: 'guessed', occurredAtHours: 300 })
    expect(hour.basis).toBeNull()
    expect(hour.hours).toBeNull()
  })

  it('refuses an hour that is not a number', () => {
    expect(shipHourOf({ occurredAtBasis: 'stated', occurredAtHours: NaN }).hours).toBeNull()
  })
})

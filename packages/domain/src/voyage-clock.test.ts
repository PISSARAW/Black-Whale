import { describe, expect, it } from 'vitest'
import {
  bracket,
  clockOf,
  curatedChronology,
  dayOf,
  formatBracket,
  formatVoyageTime,
  hasVoyageTime,
  weekdayOf,
  type ClockableEvent,
} from './voyage-clock.js'

const onVoyage = (occurredAt?: ClockableEvent['occurredAt']): ClockableEvent => ({
  onVoyage: true,
  occurredAt,
})

describe('the voyage scale', () => {
  it('counts the departure day as day 1, from noon', () => {
    expect(dayOf(0)).toBe(1)
    expect(clockOf(0)).toBe('12:00')
    expect(weekdayOf(0)).toBe('Sunday')
  })

  // The two readings chapter 374 gives of the same night, which is what fixes
  // the weekday for the whole arc.
  it('agrees with Fugetsu’s bedside clock', () => {
    expect(dayOf(37.45)).toBe(3)
    expect(weekdayOf(37.45)).toBe('Tuesday')
    expect(clockOf(37.45)).toBe('01:27')
    expect(clockOf(37.5)).toBe('01:30')
  })

  it('puts the first weekly banquet on a Sunday again', () => {
    expect(dayOf(176)).toBe(8)
    expect(weekdayOf(176)).toBe('Sunday')
    expect(clockOf(176)).toBe('20:00')
  })

  it('keeps a day running from midnight to midnight, not from the horn', () => {
    expect(dayOf(-1)).toBe(1)
    expect(dayOf(12)).toBe(2)
  })
})

describe('bracketing', () => {
  it('leaves a stated time exactly where canon puts it', () => {
    const [time] = bracket([onVoyage({ basis: 'stated', hours: 21 })])
    expect(time).toEqual({ basis: 'stated', hours: 21, earliest: 21, latest: 21 })
    expect(formatVoyageTime(time!)).toBe('Day 2 · Monday · 09:00')
  })

  it('keeps a stated window a window', () => {
    const [time] = bracket([onVoyage({ basis: 'stated', hours: 0.25, hoursUntil: 0.5 })])
    expect(formatVoyageTime(time!)).toBe('Day 1 · Sunday · 12:15-12:30')
  })

  it('marks a derived hour approximate and drops the weekday', () => {
    const [time] = bracket([onVoyage({ basis: 'derived', hours: 266.25 })])
    expect(formatVoyageTime(time!)).toBe('≈ Day 12 · 14:15')
  })

  it('widens a bare day to that day and says nothing finer', () => {
    const [time] = bracket([onVoyage({ basis: 'derived', day: 4 })])
    expect(time).toMatchObject({ basis: 'derived', earliest: 60, latest: 84 })
    expect(time!.hours).toBeUndefined()
    expect(formatVoyageTime(time!)).toBe('≈ Day 4')
  })

  it('closes an undated event between the anchors around it', () => {
    const [, middle] = bracket([
      onVoyage({ basis: 'stated', hours: 21 }),
      onVoyage(),
      onVoyage({ basis: 'stated', hours: 70 }),
    ])
    expect(middle).toEqual({ basis: 'bracketed', earliest: 21, latest: 70 })
    expect(formatVoyageTime(middle!)).toBe('Day 2 – Day 4')
  })

  it('leaves the end open past the last anchor', () => {
    const [, last] = bracket([onVoyage({ basis: 'stated', hours: 266.25 }), onVoyage()])
    expect(last).toEqual({ basis: 'bracketed', earliest: 266.25, latest: null })
    expect(formatBracket(last!)).toBe('after Day 12')
  })

  it('names the day when both bounds fall on it', () => {
    const [, middle] = bracket([
      onVoyage({ basis: 'stated', hours: 0.25 }),
      onVoyage(),
      onVoyage({ basis: 'derived', hours: 9 }),
    ])
    expect(formatBracket(middle!)).toBe('Day 1')
  })

  // An event before the horn has no voyage hour at all, and clamping it to
  // hour 0 would file Heaven's Arena aboard a ship it never touches.
  it('refuses to date what is not on the voyage', () => {
    const times = bracket([{ onVoyage: false }, onVoyage({ basis: 'stated', hours: 18 })])
    expect(times[0]).toBeUndefined()
    expect(times[1]!.earliest).toBe(18)
  })

  it('keeps the cascade monotonic across an undated stretch', () => {
    const times = bracket([
      onVoyage({ basis: 'stated', hours: 176 }),
      onVoyage(),
      onVoyage(),
      onVoyage({ basis: 'derived', day: 12 }),
    ])
    expect(times.map((time) => time!.earliest)).toEqual([176, 176, 176, 252])
    // The bound an undated event inherits is the far end of the next dated
    // one, not its near end: day 12 as a whole is what comes after, so an
    // event before it is only known to precede the end of day 12.
    expect(times.map((time) => time!.latest)).toEqual([176, 276, 276, 276])
  })
})

describe('curated chronology', () => {
  it('orders by chapter and sequence by default', () => {
    const ordered = curatedChronology([
      { chapter: 370, sequence: 1, title: 'b' },
      { chapter: 369, sequence: 2, title: 'a' },
    ])
    expect(ordered.map((event) => event.title)).toEqual(['a', 'b'])
  })

  it('moves an event a later chapter reveals back beside its anchor', () => {
    const ordered = curatedChronology([
      { chapter: 364, sequence: 1, title: 'fight' },
      { chapter: 365, sequence: 1, title: 'after' },
      { chapter: 373, sequence: 1, title: 'resurrection', occursAfterTitle: 'fight' },
    ])
    expect(ordered.map((event) => event.title)).toEqual(['fight', 'resurrection', 'after'])
  })

  it('leaves an event in place when its anchor is not in the set', () => {
    const ordered = curatedChronology([
      { chapter: 359, sequence: 3, title: 'woody', occursAfterTitle: 'Ship Departs' },
      { chapter: 360, sequence: 1, title: 'interrogation' },
    ])
    expect(ordered.map((event) => event.title)).toEqual(['woody', 'interrogation'])
  })
})

describe('voyage membership', () => {
  it('starts at the horn and skips the flashbacks', () => {
    expect(hasVoyageTime({ chapter: 358 })).toBe(false)
    expect(hasVoyageTime({ chapter: 359 })).toBe(true)
    expect(hasVoyageTime({ chapter: 396 })).toBe(false)
    expect(hasVoyageTime({ chapter: 415, isFlashback: true })).toBe(false)
  })
})

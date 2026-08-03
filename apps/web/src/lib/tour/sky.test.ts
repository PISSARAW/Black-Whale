import { describe, expect, it } from 'vitest'
import { REFERENCE_HOUR, SHIP_HOURS, shipTimeOfDay, skyOf, timeOfDayOf } from './sky'
import { SEA_GLOW, WINDOW_GLOW } from './mesh'

/** The luminance threshold the shaft pass selects a pane with. See `godRays`. */
const SHAFT_THRESHOLD = 0.9
const luma = ([r, g, b]: readonly [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

describe('skyOf', () => {
  /**
   * The one row of the table the manga draws, and the whole reason the others
   * are allowed to exist: they are derived from this, so this has to be the
   * walk exactly as it was rendered before any of them.
   */
  it('is the drawn state, to the digit, at overcast noon', () => {
    expect(skyOf(REFERENCE_HOUR).glow).toEqual(WINDOW_GLOW)
    expect(skyOf(REFERENCE_HOUR).sea).toEqual(SEA_GLOW)
  })

  it('keeps the sea at 45 % of the sky at every hour, dusk included', () => {
    for (let minute = 0; minute < 24 * 60; minute++) {
      const { glow, sea } = skyOf(minute / 60)
      for (let channel = 0; channel < 3; channel++) {
        expect(sea[channel]).toBeCloseTo(glow[channel] * 0.45, 12)
      }
    }
  })

  /**
   * The dial is closed, so a minute of the day cannot be a step. A jump here
   * would be seen as the pane changing value while nobody moved — which is the
   * one thing a window on a ship at sea does not do.
   */
  it('runs continuously round the whole clock, midnight included', () => {
    let previous = skyOf(0)
    for (let minute = 1; minute <= 24 * 60; minute++) {
      const next = skyOf(minute / 60)
      for (let channel = 0; channel < 3; channel++) {
        expect(Math.abs(next.glow[channel] - previous.glow[channel])).toBeLessThan(0.02)
      }
      expect(Math.abs(next.peak - previous.peak)).toBeLessThan(0.02)
      previous = next
    }
  })

  /**
   * Night is not the window being switched off — nothing in the walk switches a
   * surface off. It is the pane falling under the threshold the shaft pass
   * selects a source with, which is the same statement the renderer already
   * makes about every lit wall on board.
   */
  it('drops the night under the threshold that makes a pane a source', () => {
    for (const hour of [0, 1.45, 3, 23]) {
      const night = skyOf(hour)
      expect(luma(night.glow)).toBeLessThan(SHAFT_THRESHOLD)
      expect(night.peak).toBe(0)
      // A twentieth of the drawn state: whatever the frame is encoded in by the
      // time the shaft pass reads it, this is under the threshold and under
      // anything a filament lights.
      expect(luma(night.glow)).toBeLessThan(luma(WINDOW_GLOW) / 10)
    }
  })

  it('turns dawn and dusk warm, and noon cold', () => {
    expect(skyOf(7).glow[0]).toBeGreaterThan(skyOf(7).glow[2])
    expect(skyOf(19.5).glow[0]).toBeGreaterThan(skyOf(19.5).glow[2])
    expect(skyOf(REFERENCE_HOUR).glow[2]).toBeGreaterThan(skyOf(REFERENCE_HOUR).glow[0])
  })

  it('hands the shafts a hue and never a brightness', () => {
    for (const hour of [7, 10, REFERENCE_HOUR, 17.5, 19.5]) {
      expect(Math.max(...skyOf(hour).tint)).toBeCloseTo(1, 12)
    }
  })

  it('reads an hour outside the dial as the same hour of the day', () => {
    expect(skyOf(REFERENCE_HOUR + 24)).toEqual(skyOf(REFERENCE_HOUR))
    expect(skyOf(REFERENCE_HOUR - 24)).toEqual(skyOf(REFERENCE_HOUR))
  })
})

describe('shipTimeOfDay', () => {
  it('follows the projection when the visitor has not overruled it', () => {
    // Chapter 374, 37 h 30 out of port: Fugetsu's clock reads 01:27 AM, and the
    // bay behind Kurapika cannot be showing an afternoon.
    expect(shipTimeOfDay('canon', 37.5)).toBeCloseTo(1.5, 10)
  })

  /**
   * The rule of §3, at the end of the wire. A bracketed event arrives here as
   * `null` — the server refused to invent an hour for it — and what the walk
   * shows is the state the manga draws, which is what it showed before the
   * hour existed at all.
   */
  it('falls back to the drawn state when the canon dates nothing', () => {
    expect(shipTimeOfDay('canon', null)).toBe(REFERENCE_HOUR)
    expect(skyOf(shipTimeOfDay('canon', null)).glow).toEqual(WINDOW_GLOW)
  })

  it('lets the visitor overrule the projection, at any hour of the arc', () => {
    for (const hours of [0, 37.5, 200, null]) {
      expect(shipTimeOfDay('night', hours)).toBe(SHIP_HOURS.night)
      // The way out for anyone who wants the sourced state and nothing else —
      // and the override the captures and the smoke tests use.
      expect(shipTimeOfDay('noon', hours)).toBe(REFERENCE_HOUR)
    }
  })
})

describe('timeOfDayOf', () => {
  /**
   * The horn is Sunday at noon, and chapter 374 is the check the whole clock
   * was built against: Fugetsu's bedside clock reads 01:27 AM at the same hour
   * the caption counts 37 h 30 out of port.
   */
  it('puts the horn at noon and chapter 374 in the small hours', () => {
    expect(timeOfDayOf(0)).toBe(12)
    expect(timeOfDayOf(37.5)).toBeCloseTo(1.5, 10)
  })

  it('reads an hour before the horn without going negative', () => {
    expect(timeOfDayOf(-3)).toBe(9)
    expect(timeOfDayOf(-30)).toBe(6)
  })
})

import { describe, expect, it } from 'vitest'
import { LAMP_FILAMENT, REFERENCE_REGIME, regimeOf, type Regime } from './regime'
import { hex } from './light'
import { REFERENCE_HOUR, SHIP_HOURS } from './sky'

/**
 * What an hour is worth on a wall, as the renderer will actually compute it.
 *
 * `AmbientLight` multiplies its colour by its intensity, the deck multiplier
 * multiplies the result, and `toneMappingExposure` multiplies that — so the
 * level is the product of all four and never any one of them. Every regression
 * this file has caught has been a level hiding inside something that looked
 * like a hue, and it has caught that bug twice.
 */
const luma = (c: readonly [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const level = (r: Regime) =>
  luma(r.deck) * luma(r.ambient.colour) * r.ambient.intensity * r.exposure

/** How far a cast leans warm: positive is orange, negative is blue. */
const warmth = (r: Regime) => r.ambient.colour[0] - r.ambient.colour[2]

/** The filament the *fittings* burn at, in linear — see `LAMP_FILAMENT`. */
const LAMP = hex(LAMP_FILAMENT)

const HOURS = [0, 0.25]
for (let hour = 0.5; hour < 24; hour += 0.25) HOURS.push(hour)

describe('regimeOf', () => {
  it('lands exactly on the four hours the panel offers', () => {
    // Pressing a button has to hit the posed row rather than something near it,
    // or the hour the panel names is not the hour the visitor gets.
    expect(regimeOf(SHIP_HOURS.morning)).toBe(regimeOf(10))
    expect(regimeOf(SHIP_HOURS.noon)).toBe(REFERENCE_REGIME)
    expect(regimeOf(SHIP_HOURS.evening)).toBe(regimeOf(19.5))
    expect(regimeOf(SHIP_HOURS.night)).toEqual(regimeOf(3))
  })

  it('falls back to the hour ch. 380 draws, as the sky does', () => {
    expect(REFERENCE_REGIME).toBe(regimeOf(REFERENCE_HOUR))
  })

  /**
   * The guard that makes the level readable straight off the table.
   *
   * Every colour is emitted by `wash` at a luminance of exactly one, so
   * `intensity` is the light landing on a wall and nothing else is. This is what
   * makes the two-dimmers-in-series bug unrepresentable rather than merely
   * documented — and it has to hold at the interpolated hours too, which it does
   * because luminance is linear in the channels.
   */
  it('keeps the level in the intensity and nowhere else', () => {
    for (const hour of HOURS) {
      const regime = regimeOf(hour)
      expect(luma(regime.ambient.colour)).toBeCloseTo(1, 10)
      // The deck carries the white balance and never the hour: one value, the
      // same at every hour of the day, and itself at a luminance of one.
      // The bake is a scalar: no lamp colour reaches a wall, so there is
      // nothing here to correct and nothing is written.
      expect(regime.deck).toEqual([1, 1, 1])
    }
  })

  /**
   * The reversal, in one assertion.
   *
   * The version this replaces held every hour within a few per cent of one
   * level and told them apart by hue alone; the visitor read that as a filter
   * over the frame rather than as a time of day. Noon is now the brightest hour
   * of the ship's manufactured day, by construction and not by luck.
   */
  it('makes noon the highest hour of the day', () => {
    const noon = level(regimeOf(SHIP_HOURS.noon))
    for (const hour of HOURS) {
      if (hour === REFERENCE_HOUR) continue
      expect(level(regimeOf(hour))).toBeLessThan(noon)
    }
  })

  it('leaves the night well under noon, and the room plainly drawn', () => {
    // Measured against noon, which is the *day* and now sits at the level the
    // walk was tuned at before a hue quietly took a third of a stop off it. The
    // binding relation for this row is the one below, against the evening.
    const share = level(regimeOf(SHIP_HOURS.night)) / level(regimeOf(SHIP_HOURS.noon))
    expect(share).toBeGreaterThan(0.55)
    expect(share).toBeLessThan(0.7)
  })

  /**
   * The night was set by pointing at the evening, so it has to stay pointed
   * there: the same family of light, a step down. A future row that pulls one of
   * them somewhere else has to move the other or answer for it.
   */
  it('keeps the night in the evening own light', () => {
    const evening = regimeOf(SHIP_HOURS.evening)
    const night = regimeOf(SHIP_HOURS.night)
    expect(Math.abs(warmth(night) - warmth(evening))).toBeLessThan(0.12)
    const step = level(night) / level(evening)
    expect(step).toBeGreaterThan(0.75)
    expect(step).toBeLessThan(0.92)
  })

  /**
   * The two hours that were asked for as plain white light.
   *
   * Measured on the ambient alone, because with `deck` at the identity and the
   * bake carrying no colour, the ambient *is* the room's whole illuminant. The
   * walls still come out warm — their albedo is warm and that is the ship, not
   * the hour. What this holds is that nothing is added on top of it.
   */
  it('renders the middle of the day as white light', () => {
    for (const choice of ['morning', 'noon'] as const) {
      const { colour } = regimeOf(SHIP_HOURS[choice]).ambient
      expect(Math.abs(colour[0] - colour[2]) / luma(colour)).toBeLessThan(0.06)
    }
  })

  /**
   * The fittings are the one surface with a lamp colour actually baked into it,
   * so they are the one surface a white balance is meaningful on. At noon the
   * visible panels have to come out neutral, or the hall is white light lit by
   * orange lamps.
   */
  it('takes the tungsten out of the visible lamps at noon', () => {
    const { fitting } = regimeOf(SHIP_HOURS.noon)
    const burnt = fitting.map((c, i) => c * LAMP[i]!) as unknown as [number, number, number]
    expect(Math.abs(burnt[0] - burnt[2]) / luma(burnt)).toBeLessThan(0.06)
  })

  /**
   * The air may follow the hour and may not be read as a colour.
   *
   * Both extremes have shipped. A fully tinted air stained every black pixel on
   * screen; a fixed cool one took the whole hall blue the moment the bake was
   * balanced and there was no warmth left for it to sit against. What is held
   * here is the middle: a quarter of the light own chroma at most, and a
   * luminance low enough that the air can never be the brightest thing in a room.
   */
  it('lets the air follow the hour without ever becoming a colour', () => {
    const chroma = (c: readonly [number, number, number]) =>
      (Math.max(...c) - Math.min(...c)) / luma(c)
    // On a posed row the ratio is `AIR_TINT` exactly. Between two of them it is
    // not, and cannot be: the two airs being crossed sit at different values as
    // well as different hues, so the brighter end pulls the mix's chroma ahead
    // of the ambient's. It peaks a little over two fifths in the hour the day
    // comes up, which is still nowhere near a colour anyone reads.
    for (const hour of HOURS) {
      const regime = regimeOf(hour)
      expect(chroma(regime.air.colour)).toBeLessThan(chroma(regime.ambient.colour) * 0.5)
      expect(luma(regime.air.colour)).toBeLessThan(0.005)
    }
    for (const choice of ['morning', 'noon', 'evening', 'night'] as const) {
      const regime = regimeOf(SHIP_HOURS[choice])
      expect(chroma(regime.air.colour) / chroma(regime.ambient.colour)).toBeCloseTo(0.25, 6)
    }
  })

  /** Low light desaturates. A night more chromatic than noon is the eye run backwards. */
  it('takes the colour out of the night and puts it into the evening', () => {
    const noon = regimeOf(SHIP_HOURS.noon).grade.saturation
    expect(regimeOf(SHIP_HOURS.night).grade.saturation).toBeLessThan(noon)
    expect(regimeOf(SHIP_HOURS.evening).grade.saturation).toBeGreaterThan(noon)
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
      expect(Math.abs(next.ambient.intensity - previous.ambient.intensity)).toBeLessThan(0.05)
      expect(Math.abs(next.ambient.colour[0] - previous.ambient.colour[0])).toBeLessThan(0.02)
      previous = next
    }
  })

  it('reads the same at an hour and at that hour a day later', () => {
    expect(regimeOf(19.25)).toEqual(regimeOf(19.25 + 24))
    expect(regimeOf(3)).toEqual(regimeOf(3 - 24))
  })
})

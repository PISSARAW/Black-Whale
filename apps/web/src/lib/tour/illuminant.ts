/**
 * Light by the number that describes it: a temperature, and a level.
 *
 * Split out of `$lib/tour/regime` rather than left in it, and the reason is the
 * one ADR-002 gives: the table over there is a *statement about the ship* — what
 * its day looks like, hour by hour — and this is the physics that lets the table
 * be written in kelvins instead of hex literals. They change for different
 * reasons and at different times. A row of the table moves because a room looked
 * wrong; nothing in this file moves at all, because the Planckian locus does
 * not.
 *
 * The one rule it exists to enforce is that a colour never carries a level. See
 * `wash`.
 */
import type { Rgb } from './light'

/** Rec. 709 luminance, the same weights `light.ts` and the grade pass use. */
export const luminance = (c: Rgb) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

/**
 * The chromaticity of a black body at one temperature, as linear sRGB.
 *
 * Kim et al.'s cubic fit to the Planckian locus, then the standard xyY → XYZ →
 * linear-sRGB pair. It is written out rather than tabulated for the same reason
 * `skyOf` interpolates rather than switching: the table below should read as a
 * ladder of kelvins, which is the thing a lighting engineer would hand over, and
 * a row of hex literals is that ladder already flattened past the point anyone
 * can check it.
 */
export function planckian(kelvin: number): Rgb {
  const t = 1000 / kelvin
  const x =
    kelvin < 4000
      ? -0.2661239 * t ** 3 - 0.2343589 * t ** 2 + 0.8776956 * t + 0.17991
      : -3.0258469 * t ** 3 + 2.1070379 * t ** 2 + 0.2226347 * t + 0.24039
  const y =
    kelvin < 2222
      ? -1.1063814 * x ** 3 - 1.3481102 * x ** 2 + 2.18555832 * x - 0.20219683
      : kelvin < 4000
        ? -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867
        : 3.081758 * x ** 3 - 5.8733867 * x ** 2 + 3.75112997 * x - 0.37001483

  const X = x / y
  const Z = (1 - x - y) / y
  return [
    Math.max(0, 3.2406 * X - 1.5372 - 0.4986 * Z),
    Math.max(0, -0.9689 * X + 1.8758 + 0.0415 * Z),
    Math.max(0, 0.0557 * X - 0.204 + 1.057 * Z),
  ]
}

/**
 * A wash at one colour temperature and one level.
 *
 * The colour comes back normalised to a luminance of exactly one, so the level
 * asked for is the level landing on the wall and the hue cannot smuggle a
 * dimming in with it. That is the whole guard, and it is why every row goes
 * through here instead of writing a hex: `0x4c5a70` reads as a plausible cool
 * grey and is a linear luminance of 0.13 against a cream's 0.79 — a six-fold
 * drop hidden inside what looks like a hue, and this file shipped it once.
 *
 * A warm channel comes out above one, which is correct and not a clamp waiting
 * to happen: `AmbientLight` multiplies colour by intensity in linear space and
 * neither is bounded at one. It is the *hex* that cannot hold these values,
 * which is the second reason the table stopped using them.
 */
export function wash(kelvin: number, level: number): { colour: Rgb; intensity: number } {
  const raw = planckian(kelvin)
  const scale = 1 / luminance(raw)
  return { colour: [raw[0] * scale, raw[1] * scale, raw[2] * scale], intensity: level }
}

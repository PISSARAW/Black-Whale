/**
 * What the hour does to the *inside* of the ship.
 *
 * `sky.ts` settles what the two openings show, and says — correctly — that
 * nothing outside those two rooms reads any of it: there is no daylight in a
 * corridor on Tier 3 at any hour. That left the walk with a real hole in it all
 * the same. At 01:27 and at 13:00 the other three hundred and twelve spaces were
 * pixel for pixel the same room, and a visitor who moved the clock saw two
 * rectangles change and nothing else. The ship had an hour and did not keep it.
 *
 * **This file is an authored palette, and it says so.** That is a change of
 * status worth stating plainly, because the first version of it was not. It was
 * written as a derivation — a night watch, the lighting regime a vessel at sea
 * actually goes to — and it dimmed the ship by about a stop after dark. What was
 * asked for instead is four hours that differ in *colour* and not in level: a
 * morning under a blue sky, a noon under a sun, an evening in a hall lit for a
 * party, and a night that is orange and still lit. None of that is derivable
 * from anything the sources say about a hull with two windows in it, and
 * dressing it as a derivation would be the one thing the rest of this
 * reconstruction refuses to do.
 *
 * So it is a palette, chosen, and its claim is aesthetic rather than
 * evidentiary. What keeps it honest is what it is *not* allowed to touch: the
 * two windows still carry the sourced sky out of `sky.ts`, the class ladder
 * `light.ts` bakes into the vertices is multiplied wholesale and never
 * reordered, and the level stays within a few per cent of the tuned exposure at
 * every hour — so no room becomes readable at one hour and unreadable at
 * another. The hour changes what the ship *feels* like, not what it says.
 *
 * Nothing here reads a clock. The hour is handed in, like `skyOf`'s.
 */
import { GRADE_DEFAULTS } from './postGrade'
import { hex, type Rgb } from './light'

/** What the hour leaves on every surface of the ship that is not a window. */
export interface Regime {
  /**
   * A multiplier on the baked light of the deck — a colour rather than a
   * number, because a watch regime is dimmer *and* warmer and one figure could
   * only say the first.
   *
   * Applied on the structural material, so it multiplies the vertex bake
   * wholesale: the class ladder `light.ts` built survives untouched, the whole
   * ladder simply comes down together. Deliberately a gentle amber and not the
   * red of a darkroom — the walk's proof system is a colour one, a filament
   * warm and a window cold, and a night that painted the infirmary's cold
   * fluorescents amber would have collapsed the distinction the grade is
   * forbidden from touching.
   */
  deck: Rgb
  /**
   * The same on the fittings, which dim with what they are lighting.
   *
   * It must not run *ahead* of `deck`, and that is a rendering fact rather than
   * a lighting one. The fittings are written above white so the bloom and the
   * halation both key off them, and in a hall the size of the banquet room what
   * those two spill is most of what is landing on the floor — so a night that
   * took the lamps down harder than the deck took the deck down with them,
   * twice. Held at the deck's own multiplier: the lamps dim with the room, not
   * faster than it.
   */
  fitting: Rgb
  /**
   * The wash over everything: what colour it is, and how hard.
   *
   * The two are not independent and the trap is worth naming, because it cost
   * three passes at this table to find. `AmbientLight` multiplies its colour by
   * its intensity, and `hex` returns a **linear** colour — so the value of the
   * hex is part of the level, not just its hue. The night was first written at
   * `0x4c5a70`, which reads as a plausible cool grey and is a linear luminance of
   * 0,13 against the day's 0,78: a six-fold drop hidden inside what looked like a
   * hue, on top of the intensity that was meant to be doing the dimming. The deck
   * went to a fifth of the day and the floor of the banquet hall stopped being
   * drawn.
   *
   * So a colour here is picked at roughly the day's own *value* and differs from
   * it in hue alone, and `intensity` is the only thing that says how dark the
   * hour is. Anything else is two dimmers wired in series with one label.
   */
  ambient: { colour: Rgb; intensity: number }
  /** The air: the colour it closes to, and a multiplier on its density. */
  air: { colour: Rgb; density: number }
  /** A multiplier on the visitor's own aperture — never a replacement for it. */
  exposure: number
  /** The grade, absolute. `GRADE_DEFAULTS` at the reference hour, exactly. */
  grade: { contrast: number; saturation: number; vignette: number }
  /**
   * How much of the dust shows.
   *
   * Up at night, and for a reason rather than for the look: ventilation on a
   * night regime runs down with the lighting, and what a still room does is
   * hold what is in the air instead of moving it along.
   */
  motes: number
}

/**
 * One posed hour, from which the rest is interpolated.
 *
 * The hour sits beside the regime rather than inside it, so a posed hour can be
 * handed back untouched without the table's own bookkeeping riding out with it.
 */
interface RegimeState {
  /** Local time aboard, in hours past midnight. */
  at: number
  regime: Regime
}

const mix = (from: number, to: number, t: number) => from + (to - from) * t

const mixRgb = (from: Rgb, to: Rgb, t: number): Rgb => [
  mix(from[0], to[0], t),
  mix(from[1], to[1], t),
  mix(from[2], to[2], t),
]

/**
 * The four hours, and the one rule that keeps them comparable.
 *
 * Each is a cast — a `deck` multiplier and an ambient colour — and each carries
 * an `intensity` chosen so that the *level* comes out the same. `AmbientLight`
 * multiplies its colour by its intensity and `hex` returns a linear colour, so
 * the value of the hex is part of the level and not just its hue: a blue-white
 * of 0xb4d2ff is 0,63 in luminance where the old cream was 0,795, and left at
 * the same intensity the morning would simply be a dimmer noon. The intensities
 * below are therefore computed rather than picked — `day / (luma(colour) ×
 * luma(deck))`, times the share of the day this hour is meant to sit at — and
 * the shares are 1, 1, 0,96 and 0,88. Four hours you can tell apart with your
 * eyes shut to the colour, by nothing but which way the walls have gone.
 *
 * That is also the whole of the correction this file has been through. It first
 * put the level in the hue by accident (a plausible-looking dark blue that was a
 * six-fold dimming) and then put it there on purpose (a night watch a stop
 * down), and the second was as wrong as the first for what is wanted here: a
 * night the visitor cannot read is not a night, it is an outage.
 */

/**
 * A blue sky, on a ship that has no sky.
 *
 * The most invented of the four and the one that reads hardest, because every
 * filament the bake put on these walls is warm and the morning has to overcome
 * all of them: the deck multiplier is the only one here that takes red *below*
 * one. What it is reaching for is the hour when a hull feels like it is under
 * daylight even where there is none.
 */
const MORNING: Regime = {
  deck: [0.82, 0.95, 1.18],
  fitting: [0.86, 0.96, 1.14],
  ambient: { colour: hex(0xb4d2ff), intensity: 2.96 },
  air: { colour: hex(0x0c141f), density: 1 },
  exposure: 1,
  grade: { contrast: 1.12, saturation: 1.06, vignette: 0.31 },
  motes: 1,
}

/** A sun. The warmest the ship gets without leaving white behind. */
const NOON: Regime = {
  deck: [1.08, 1.02, 0.86],
  fitting: [1.06, 1.01, 0.9],
  ambient: { colour: hex(0xffe7ae), intensity: 2.1 },
  air: { colour: hex(0x14110a), density: 0.95 },
  exposure: 1,
  // `GRADE_DEFAULTS` itself and not a copy of its digits, on the argument
  // `sky.ts` makes for reading `WINDOW_GLOW` out of `mesh.ts`: noon is the hour
  // the walk was graded at, and the one place that grade is written stays
  // `postGrade`. The other three rows move around this one.
  grade: {
    contrast: GRADE_DEFAULTS.contrast,
    saturation: GRADE_DEFAULTS.saturation,
    vignette: GRADE_DEFAULTS.vignette,
  },
  motes: 0.95,
}

/**
 * A hall lit for a party: yellow, and the fullest colour of the four.
 *
 * Green is held up beside red rather than let fall — that is the difference
 * between a yellow and an orange, and it is the whole of what separates this row
 * from the next one. Written first with green down at 0,99 the evening and the
 * night were the same hour twice, eight points apart on a measure that runs to
 * seventy.
 */
const EVENING: Regime = {
  deck: [1.1, 1.02, 0.7],
  fitting: [1.09, 1.02, 0.74],
  ambient: { colour: hex(0xffdc82), intensity: 2.23 },
  air: { colour: hex(0x1a1108), density: 1.05 },
  exposure: 1,
  grade: { contrast: 1.14, saturation: 1.18, vignette: 0.36 },
  motes: 1.15,
}

/**
 * Orange, and still lit.
 *
 * Ten per cent under the day and no more. The night is told by its colour and by
 * the air closing in around it — never by taking the room away.
 *
 * The only row that takes green properly down, which is what makes it read as
 * orange against the evening's yellow rather than as more of the same.
 */
const NIGHT: Regime = {
  deck: [1.24, 0.88, 0.54],
  fitting: [1.2, 0.9, 0.6],
  ambient: { colour: hex(0xffad5c), intensity: 3.25 },
  air: { colour: hex(0x150c05), density: 1.12 },
  exposure: 0.98,
  grade: { contrast: 1.16, saturation: 1.14, vignette: 0.4 },
  motes: 1.3,
}

/**
 * The hour anything with no hour at all falls back to: the one ch. 380 draws.
 *
 * `sky.ts` falls back to `REFERENCE_HOUR` for an event the canon does not date
 * closely enough to put a clock on, and this has to be the same hour or the two
 * halves of the fallback would disagree — the windows showing the drawn noon
 * over a deck lit for some other time of day.
 */
export const REFERENCE_REGIME: Regime = NOON

/**
 * The table, midnight round to midnight.
 *
 * The four posed rows sit exactly on the four hours the visitor can ask for —
 * `SHIP_HOURS` in `$lib/tour/sky`, 10:00, 13:00, 19:30 and 01:00 — so pressing a
 * button lands on the row itself rather than somewhere near it, and what the
 * panel offers is what the table holds. The rows between them are two of the
 * four met half way, which is all a changeover is.
 *
 * The night runs flat from 23:30 round to 05:00. An hour of the middle watch is
 * the same hour whichever one it is, and a ramp through it would be the walk
 * animating a change nobody stood up for.
 */
const STATES: readonly RegimeState[] = [
  { at: 0, regime: NIGHT },
  { at: 5, regime: NIGHT },
  { at: 7.5, regime: between(NIGHT, MORNING, 0.5) },
  { at: 10, regime: MORNING },
  { at: 13, regime: NOON },
  { at: 16, regime: between(NOON, EVENING, 0.5) },
  { at: 19.5, regime: EVENING },
  { at: 22, regime: between(EVENING, NIGHT, 0.5) },
  { at: 23.5, regime: NIGHT },
]

/** Two posed hours met part way — a changeover, and the only thing between them. */
function between(from: Regime, to: Regime, t: number): Regime {
  return {
    deck: mixRgb(from.deck, to.deck, t),
    fitting: mixRgb(from.fitting, to.fitting, t),
    ambient: {
      colour: mixRgb(from.ambient.colour, to.ambient.colour, t),
      intensity: mix(from.ambient.intensity, to.ambient.intensity, t),
    },
    air: {
      colour: mixRgb(from.air.colour, to.air.colour, t),
      density: mix(from.air.density, to.air.density, t),
    },
    exposure: mix(from.exposure, to.exposure, t),
    grade: {
      contrast: mix(from.grade.contrast, to.grade.contrast, t),
      saturation: mix(from.grade.saturation, to.grade.saturation, t),
      vignette: mix(from.grade.vignette, to.grade.vignette, t),
    },
    motes: mix(from.motes, to.motes, t),
  }
}

/**
 * The ship's own regime at one hour of its day.
 *
 * The dial is closed, so an hour past the last state runs on to the first
 * through midnight rather than clamping — and since both ends hold `WATCH`, what
 * that produces is an hour of night that is the same night at 23:30 and at
 * 00:30, which is the truth about a ship on watch.
 */
export function regimeOf(timeOfDay: number): Regime {
  const hour = ((timeOfDay % 24) + 24) % 24

  // A posed hour is handed back untouched rather than interpolated to itself.
  // The reference has to be the identity to the last bit, and `1 + (1 - 1) * t`
  // is not something binary floating point will promise for every `t`.
  for (const state of STATES) if (hour === state.at) return state.regime

  for (let i = 0; i + 1 < STATES.length; i++) {
    const from = STATES[i]!
    const to = STATES[i + 1]!
    if (hour < from.at || hour > to.at) continue
    return between(from.regime, to.regime, (hour - from.at) / (to.at - from.at))
  }

  // The wrap: from the last state round midnight to the first.
  const last = STATES[STATES.length - 1]!
  const first = STATES[0]!
  const span = 24 - last.at + first.at
  return between(last.regime, first.regime, (hour - last.at) / span)
}

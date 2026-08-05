/**
 * What the hour does to the *inside* of the ship.
 *
 * `sky.ts` settles what the two openings show, and says — correctly — that
 * nothing outside those two rooms reads any of it: there is no daylight in a
 * corridor on Tier 3 at any hour, and inventing one would be the walk lying
 * about a hull. That left the walk with a real hole in it all the same. At 01:27
 * and at 13:00 the other three hundred and twelve spaces were pixel for pixel
 * the same room, and a visitor who moved the clock saw two rectangles change and
 * nothing else. The ship had an hour and did not keep it.
 *
 * What fills the hole is not light from outside. It is the ship's own routine.
 * A vessel at sea does not burn its accommodation lighting flat around the
 * clock: it goes to a night regime — the passageways dropped to a fraction of
 * their day level and shifted warm so a watchkeeper crossing from a lit space to
 * a dark bridge wing is not blinded, the machinery spaces left as they are
 * because a running plant is a running plant at four in the morning. That is a
 * fact about ships and not about this ship, which puts it in exactly the class
 * `DECK_LIGHT` and `HULL_DECKS` are already in: derived, stated as derived,
 * computed from the one figure the sources give — here the hour, which the
 * voyage clock already stamps on every event.
 *
 * The anchor is the same anchor as everywhere else. At `REFERENCE_HOUR` this
 * file is the **identity**: every multiplier is one, every colour is the colour
 * the walk was tuned at, and the grade is `GRADE_DEFAULTS` to the digit. The ship
 * at the banquet of ch. 380 is the ship as it has always been drawn, and the
 * regime is something that happens on either side of it. `regime.test.ts` holds
 * that, so no future row of this table can quietly move the reference.
 *
 * Nothing here reads a clock. The hour is handed in, like `skyOf`'s.
 */
import { GRADE_DEFAULTS } from './postGrade'
import { hex, type Rgb } from './light'

/**
 * The ambient wash and the far air, as the walk was tuned with them.
 *
 * Written here rather than in `TourAtmosphereView` — which imports them — for
 * the reason `sky.ts` reads `WINDOW_GLOW` out of `mesh.ts` instead of copying
 * its digits: the table below has to *be* the tuned values at 13:00, and two
 * copies of a constant are two constants that drift.
 */
export const DAY_AMBIENT = 0xf6e5c1
export const DAY_AMBIENT_INTENSITY = 2.2
export const DAY_AIR = 0x0b1118

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

const DAY: Omit<Regime, 'deck' | 'fitting'> = {
  ambient: { colour: hex(DAY_AMBIENT), intensity: DAY_AMBIENT_INTENSITY },
  air: { colour: hex(DAY_AIR), density: 1 },
  exposure: 1,
  grade: {
    contrast: GRADE_DEFAULTS.contrast,
    saturation: GRADE_DEFAULTS.saturation,
    vignette: GRADE_DEFAULTS.vignette,
  },
  motes: 1,
}

/**
 * The watch, at its deepest.
 *
 * The two multipliers have one job each, and getting that wrong is how this row
 * was first written. `deck` and `ambient.intensity` both land on the same baked
 * vertex colour, so a night that halved the first and halved the second came out
 * at a quarter of the day — two stops, which is not a passageway on night
 * lighting, it is a power cut. The floor of the banquet hall stopped being drawn
 * at all and the room was left as its own gold outline.
 *
 * So the *level* is the ambient's to set and the ambient's alone — a little over
 * two thirds of the day, which with the aperture is about one stop and is
 * roughly where a passageway on night lighting actually sits — and `deck` is
 * near-neutral in luminance and carries only the **cast**: about two hundred
 * kelvin of amber, enough that a visitor stepping out of a stairwell knows the
 * ship has turned its lights down, nowhere near enough to recolour a room.
 *
 * The air is the third dial and it is the one that has to be held down hardest,
 * which is not obvious. In a hall the size of the banquet room most of the frame
 * is fog rather than surface, so the colour the air closes to and the density it
 * closes at together decide more of the picture's level than the lamps do: at a
 * deep 0x05080e and 1,3 the night measured at 0,37 of the day and the floor of
 * the hall simply stopped being drawn, with the whole room left as its own gold
 * outline. A twelve per cent thickening and an air two shades under the day's is
 * what the night is worth. Night aboard is not the day with a filter on it; it is
 * a narrower aperture on a ship that has put its own lights down — and you have
 * to still be able to see the deck you are standing on.
 */
const WATCH: Regime = {
  deck: [0.86, 0.78, 0.68],
  fitting: [0.86, 0.78, 0.68],
  ambient: { colour: hex(0xc2cede), intensity: 1.85 },
  air: { colour: hex(0x090e16), density: 1.12 },
  exposure: 0.94,
  grade: { contrast: 1.22, saturation: 0.96, vignette: 0.45 },
  motes: 1.4,
}

/**
 * The table, midnight round to midnight.
 *
 * Seven states and straight lines between them, in the pattern of `DECK_LIGHT`,
 * `hullRumble` and `STATES` in `sky.ts` — and closed the same way, so the small
 * hours are one flat stretch of watch rather than a ramp through nothing.
 *
 * - 23:00 / 00:00 / 05:00 — the watch, unchanged across the whole of the night.
 *   Three rows for one state, so the small hours are genuinely flat: an hour of
 *   the middle watch is the same hour whichever one it is, and a ramp through
 *   them would be the walk animating a changeover nobody stood up for.
 * - 07:00 — the lights come up. Half the distance back, which is what a ship
 *   changing over looks like: not a switch, a period.
 * - 09:00 — the day, and the day is the tuned picture.
 * - 13:00 — the reference. The identity, and the test says so.
 * - 18:00 — the one hour that is neither. The regime has not changed yet and
 *   the light has not either, but the *ship* has: this is the hour the walk is
 *   allowed to be beautiful on its own account — a touch of extra saturation and
 *   a touch less contrast, which is what an evening interior does under warm
 *   filaments. It carries the same status as dawn in `sky.ts`: derived, and
 *   marked.
 * - 21:00 — the changeover the other way, and steeper. A ship darkens faster
 *   than it lights: the watch is set at once and the day comes up by degrees.
 */
/** The identity, for anything that wants the tuned picture and no hour at all. */
export const REFERENCE_REGIME: Regime = { deck: [1, 1, 1], fitting: [1, 1, 1], ...DAY }

const STATES: readonly RegimeState[] = [
  { at: 0, regime: WATCH },
  { at: 5, regime: WATCH },
  {
    at: 7,
    regime: {
      deck: [0.93, 0.9, 0.86],
      fitting: [0.88, 0.85, 0.8],
      ...blend(WATCH, REFERENCE_REGIME, 0.5),
    },
  },
  { at: 9, regime: REFERENCE_REGIME },
  { at: 13, regime: REFERENCE_REGIME },
  {
    at: 18,
    regime: {
      deck: [1.02, 0.97, 0.9],
      fitting: [1.04, 0.98, 0.9],
      ambient: { colour: hex(0xf8dcae), intensity: 2.15 },
      air: { colour: hex(0x100e12), density: 1.05 },
      exposure: 1.02,
      grade: { contrast: 1.15, saturation: 1.14, vignette: 0.36 },
      motes: 1.15,
    },
  },
  {
    at: 21,
    regime: {
      deck: [0.9, 0.83, 0.73],
      fitting: [0.8, 0.73, 0.63],
      ...blend(WATCH, REFERENCE_REGIME, 0.34),
    },
  },
  { at: 23, regime: WATCH },
]

/** Everything but the two multipliers, met part way — the shared half of a row. */
function blend(from: Regime, to: Omit<Regime, 'deck' | 'fitting'>, t: number) {
  return {
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

function between(from: Regime, to: Regime, t: number): Regime {
  return {
    deck: mixRgb(from.deck, to.deck, t),
    fitting: mixRgb(from.fitting, to.fitting, t),
    ...blend(from, to, t),
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

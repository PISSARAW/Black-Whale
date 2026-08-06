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
 * **The hole is filled by the ship's own lamps, and they are tunable.** A hull
 * that carries people for months behind two windows has to manufacture a day for
 * them or they stop having one — that is what long-haul vessels, submarines and
 * polar stations all do, and they do it the same way: white-tunable fittings on
 * a circadian schedule, cool and high at the middle of the day, warm and low at
 * the end of it. So the claim here is the same class as `SEA_GLOW` and as dawn
 * in `sky.ts`: derived from something nobody disputes, and marked as derived.
 *
 * This replaces an authored palette — four hours told apart by *colour at one
 * level*, a blue morning and an orange night. It read as a filter laid over the
 * finished frame rather than as light, and for a reason that is worth keeping
 * written down, because it is the trap this file keeps falling into from a new
 * direction each time: **the hue was being carried by the air.** `air.colour` is
 * the fog and the clear colour, and in a hall the size of the banquet room the
 * air is most of the frame — including every surface that receives no light at
 * all. Tint it and the blacks stain, the materials collapse onto one value, and
 * the depth goes. Three rules come out of that, and they are the whole design:
 *
 * - **The hue is carried by what lights.** `ambient` and `fitting`, never `air`.
 * - **The level is one dial.** `ambient.intensity`, and nothing else. Every
 *   colour in the table is emitted by `wash` at a luminance of exactly one, so
 *   the intensity *is* the level — the two-dimmers-in-series bug that cost this
 *   file three passes is now unrepresentable rather than merely documented.
 * - **The steel stays steel.** `deck` is the identity at every hour, and the
 *   reason is worth writing down because getting it wrong cost a version. The
 *   bake is *not* coloured: `mesh.ts` writes `albedo × openness × (fill + gain ×
 *   sources)` into each vertex, and `sources` is a **scalar**. A lamp's colour
 *   reaches the fittings and nothing else — `lamplightOf` gives the room its
 *   `power`, never its `glow`. So there is no tungsten illuminant under the
 *   walls to divide back out, and a white balance written on `deck` is not a
 *   correction of anything: it is a raw blue multiplier on albedos that are
 *   warm on purpose, and it turns the hall blue. The only illuminant the room
 *   has is the ambient, which is where its colour belongs.
 *
 * Nothing here reads a clock. The hour is handed in, like `skyOf`'s.
 */
import { GRADE_DEFAULTS } from './postGrade'
import { hex, type Rgb } from './light'
import { luminance, wash } from './illuminant'

/** What the hour leaves on every surface of the ship that is not a window. */
export interface Regime {
  /**
   * A multiplier on the baked light of the deck, and the identity at every hour.
   *
   * Kept as a field rather than deleted because the material needs a written
   * value each time the hour lands. It has now been wrong in both directions:
   * as a cast of the hour it doubled the ambient's own and turned rooms orange,
   * and as a white balance it turned them blue, because the bake it was
   * correcting is a scalar and has no colour to correct. Nothing goes here.
   */
  deck: Rgb
  /**
   * The same on the fittings, which dim with what they are lighting.
   *
   * Unlike `deck` this one does move, and it has to: the fittings are
   * `MeshBasicMaterial`, so no light reaches them and the ambient cannot tell
   * them anything. They are the only lamps in a hall that has no window, and an
   * hour that changed the room while the lamps lighting it stayed a fixed
   * white-hot was the single most dishonest thing in the last version. Derived
   * rather than picked — `lamps` below — so it can neither drift from the hour's
   * own colour nor run ahead of its level.
   */
  fitting: Rgb
  /**
   * The wash over everything: what colour it is, and how hard.
   *
   * `colour` is always at a luminance of one — see `wash` — so `intensity` is
   * the level in the only sense that matters, the light actually landing on a
   * wall. Two consequences, and the second is the one that used to be a bug:
   * a row can be read straight off the table, and two rows interpolate without
   * drifting, because luminance is linear and the midpoint of two colours at
   * luminance one is a colour at luminance one.
   */
  ambient: { colour: Rgb; intensity: number }
  /**
   * The air: the colour it closes to, and a multiplier on its density.
   *
   * **The one thing in this file forbidden to carry the hour.** It may move in
   * value — the night closes a little darker and a little thicker — and it may
   * not move in hue at any hour, ever. Warm light and cold air is where the
   * depth of the room comes from; warm light and warm air is a photograph with
   * a filter on it.
   */
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
 * The temperatures the fittings actually render at.
 *
 * Deliberately a thousand kelvin above what the fixtures would be specified at —
 * a warm-white lamp is a 2700 K part and the night below is 3800 K — because the
 * walk has no chromatic adaptation and the eye does. A
 * standing observer white-balances a warm room within a minute and stops seeing
 * the orange; a render does not, and a literal 2700 K night comes out as sodium.
 * The offset is the eye's own correction, done in the table because there is
 * nowhere else in the pipeline to do it.
 */
const NIGHT_KELVIN = 3900
const MORNING_KELVIN = 6300
const NOON_KELVIN = 6500
const EVENING_KELVIN = 4100

/**
 * The level the walk is tuned at, and the anchor every share below is taken of.
 *
 * `2.2` is the figure the walk had before any of this existed, and getting back
 * to it took finding a bug in a commit called « Améliore l'ambiance visuelle ».
 * That commit changed `new AmbientLight(0xffffff, 2.2)` to
 * `new AmbientLight(0xf6e5c1, 2.2)` — which reads as a change of hue and is a
 * change of *level*: `hex(0xf6e5c1)` has a luminance of 0.795, so the ship
 * quietly lost a third of a stop and every table written afterwards, this one
 * included, took the reduced figure for the reference and built on it.
 *
 * It is the same trap `wash` exists to close, one layer further out — and it is
 * the reason the anchor is written here as a *level* rather than as a colour and
 * an intensity. A hue cannot dim the ship any more; only this number can.
 */
const DAY_LEVEL = 2.2

/**
 * The far air: the hour's own colour, taken almost all the way out.
 *
 * This constant has now been wrong in both directions and the middle is the
 * answer. Written as a hue of the hour, it stained every black pixel on screen —
 * the fog and the clear colour cover most of a hall this size, including the
 * surfaces receiving no light at all. Written as a fixed cool navy, it did
 * nothing at all while the bake was tungsten and then took the whole room the
 * moment the bake was balanced: with the light neutral there was no warmth left
 * to sit against, and the hall simply went blue.
 *
 * And it must not be *bright*, which is the third way this went wrong: at 0.005
 * of luminance the far air was three times the near-black the walk was tuned
 * against, and in a hall three hundred metres long that is what closes the far
 * end. The day now sits at 0.0016 — `0x050505`, the value the renderer still
 * clears to — and only the night is allowed to thicken and come forward.
 *
 * So the air follows the hour and keeps a quarter of it. That is enough for warm
 * light to still have somewhere cooler to fall away into, and far too little to
 * be read as a colour of its own. `value` is the linear luminance the air closes
 * at, carried on its own so that — as everywhere else in this file — nothing
 * hides a level inside a hue.
 */
const AIR_TINT = 0.25
const AIR_VALUE_DAY = 0.0016
const AIR_VALUE_EVENING = 0.003
const AIR_VALUE_NIGHT = 0.0039

function airOf(kelvin: number, value: number): Rgb {
  const hue = wash(kelvin, 1).colour
  const damped: Rgb = [
    1 + (hue[0] - 1) * AIR_TINT,
    1 + (hue[1] - 1) * AIR_TINT,
    1 + (hue[2] - 1) * AIR_TINT,
  ]
  const scale = value / luminance(damped)
  return [damped[0] * scale, damped[1] * scale, damped[2] * scale]
}

/** The hour lights the ship. It does not repaint it — see `Regime.deck`. */
const STEEL: Rgb = [1, 1, 1]

/**
 * The filament the *fittings* burn at, and how hard to divide it back out.
 *
 * This is the one place on the ship where a lamp's colour is actually baked
 * in. `mesh.ts` writes `lamplight.glow` into the fittings' own vertices — the
 * visible ceiling panels — and `glow` is a deck temperature met half way with a
 * category hue, which lands near `0xffd4a2` on the accommodation decks. Every
 * other surface gets that lamp as a *scalar* and never as a colour.
 *
 * So the balance is scoped to the fittings and to nothing else. Without it the
 * lamps stay tungsten in a room the ambient has taken to daylight, which is the
 * mismatch the eye catches first — a white hall lit by orange panels. With it on
 * anything wider, the correction has nothing to cancel and simply paints.
 */
export const LAMP_FILAMENT = 0xffd4a2
const BALANCE_STRENGTH = 1

const LAMP_BALANCE: Rgb = (() => {
  const lamp = hex(LAMP_FILAMENT)
  const raw: Rgb = [
    (1 / lamp[0]) ** BALANCE_STRENGTH,
    (1 / lamp[1]) ** BALANCE_STRENGTH,
    (1 / lamp[2]) ** BALANCE_STRENGTH,
  ]
  const scale = 1 / luminance(raw)
  return [raw[0] * scale, raw[1] * scale, raw[2] * scale]
})()

/** The hue of the reference hour, which the fittings are measured against. */
const NOON_HUE = wash(NOON_KELVIN, 1).colour

/**
 * What the visible lamps are worth at an hour: its cast, times its dimming.
 *
 * The cast is the hour's own hue divided by noon's, so the reference comes out
 * at `[1, 1, 1]` exactly and the fittings can never disagree with the ambient
 * about what colour the ship is burning. The dimming is the hour's share of the
 * day and not its share divided by the aperture: `toneMappingExposure` reaches
 * the lamps and the walls alike, so it cancels out of the comparison, and what
 * this multiplier has to match is the *ambient's* own share. The bloom and the
 * halation key off these, and in a hall this size that spill is most of what
 * reaches the floor: lamps that did not dim were a night that never got dark
 * however far the ambient came down.
 */
function lamps(kelvin: number, share: number): Rgb {
  const hue = wash(kelvin, 1).colour
  // The fittings' own vertex colours were baked under the same filament, so
  // they take the same balance as the deck — otherwise the lamps would stay
  // tungsten in a room that no longer is, which is the mismatch you see first.
  const cast: Rgb = [
    (hue[0] / NOON_HUE[0]) * LAMP_BALANCE[0],
    (hue[1] / NOON_HUE[1]) * LAMP_BALANCE[1],
    (hue[2] / NOON_HUE[2]) * LAMP_BALANCE[2],
  ]
  // The cast is normalised for the same reason `wash` normalises: a ratio of
  // two hues is not itself at luminance one, and left alone it would put a few
  // per cent of dimming inside what is meant to be a colour. Taken out here,
  // `luminance(fitting) × exposure` is the hour's share of the day exactly —
  // which is a thing a test can hold rather than approximately hold.
  const dim = share / luminance(cast)
  return [cast[0] * dim, cast[1] * dim, cast[2] * dim]
}

/**
 * A morning: white, and not yet at full.
 *
 * Two hundred kelvin under noon and a tenth below it in level. Both hours are meant to
 * read as plain white light — asked for in those words — so what separates them
 * is the level, a grade with a little more contrast and a little less colour,
 * and a morning that is the crisper of the two rather than the warmer. That is
 * also the honest direction for a manufactured day: a ship bringing its people
 * awake runs the cold end of its lamps in the morning, which is what circadian
 * lighting is for in the first place.
 */
const MORNING: Regime = {
  deck: STEEL,
  fitting: lamps(MORNING_KELVIN, 0.9),
  ambient: wash(MORNING_KELVIN, DAY_LEVEL * 0.9),
  air: { colour: airOf(MORNING_KELVIN, AIR_VALUE_DAY), density: 1 },
  exposure: 1,
  grade: { contrast: 1.14, saturation: 1.02, vignette: 0.34 },
  motes: 1,
}

/**
 * Noon, and a real one: 6500 K, the coolest and the highest hour of the ship.
 *
 * This is the row that moved furthest, and it moved twice. The palette's noon
 * was a 4400 K cream — a filament's colour, which is what a room *lit by lamps
 * at midday* looks like and is not what anyone means by noon. The first
 * correction put it at 5600 K, which is daylight but not white: sRGB's own white
 * point is D65, so anything under about 6500 K renders with a cast however
 * correctly it was derived. This row sits on the white point, which is the only
 * temperature at which "white light" means what it says.
 */
const NOON: Regime = {
  deck: STEEL,
  fitting: lamps(NOON_KELVIN, 1),
  ambient: wash(NOON_KELVIN, DAY_LEVEL),
  air: { colour: airOf(NOON_KELVIN, AIR_VALUE_DAY), density: 1 },
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
 * A hall lit for a party, which is the one hour that does not follow the sun.
 *
 * Every other row falls with the day. This one does not: 4000 K and ninety-five
 * per cent of noon, the vignette opened and the saturation up — because a
 * reception room in the evening is a room somebody has just switched *on*. It is
 * the warmest bright hour of the four, and that combination is the whole reason
 * an evening looks like an evening rather than like a dimmed afternoon.
 */
const EVENING: Regime = {
  deck: STEEL,
  fitting: lamps(EVENING_KELVIN, 0.754),
  ambient: wash(EVENING_KELVIN, DAY_LEVEL * 0.754),
  air: { colour: airOf(EVENING_KELVIN, AIR_VALUE_EVENING), density: 1.03 },
  exposure: 1,
  grade: { contrast: 1.1, saturation: 1.16, vignette: 0.29 },
  motes: 1.15,
}

/**
 * The night: the evening's own light, a fifth down and a shade warmer.
 *
 * Set by pointing rather than by argument — the row that was the *evening* was
 * the one wanted for the night, so this row is that row moved. A stop down was
 * tried first, then two thirds of one; both read as an outage rather than as a
 * night, which is a thing this file has now got wrong four times in a row and
 * has stopped arguing with. `0.82` on the ambient times `0.98` on the aperture
 * is `0.804`: a third of a stop, visible beside the evening and nowhere near
 * costing the far end of the hall.
 *
 * The saturation still sits under the evening's, which is not a stylistic choice
 * but the direction the eye actually goes: low light desaturates, and a night
 * that is the most chromatic image of the four — which the palette's was — is
 * the eye run backwards.
 */
const NIGHT: Regime = {
  deck: STEEL,
  fitting: lamps(NIGHT_KELVIN, 0.651),
  ambient: wash(NIGHT_KELVIN, DAY_LEVEL * 0.651),
  air: { colour: airOf(NIGHT_KELVIN, AIR_VALUE_NIGHT), density: 1.1 },
  exposure: 0.98,
  grade: { contrast: 1.14, saturation: 1.02, vignette: 0.36 },
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

/**
 * Two posed hours met part way — a changeover, and the only thing between them.
 *
 * The ambient interpolates as a colour and an intensity separately, which used
 * to overshoot the level by a couple of per cent and needed a note apologising
 * for it. It no longer can: luminance is a linear function of the channels, so
 * the midpoint of two colours at luminance one is itself at luminance one, and
 * the interpolated intensity is the interpolated level exactly.
 */
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
 * through midnight rather than clamping — and since both ends hold `NIGHT`, what
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

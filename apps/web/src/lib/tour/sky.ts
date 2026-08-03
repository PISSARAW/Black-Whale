/**
 * The hour of the sky, for the two openings that have one.
 *
 * The Black Whale sails all day and it is dark all day: the day enters this hull
 * through two openings in three hundred and fourteen spaces — the observation
 * deck's bay (ch. 380) and the King's great window (ch. 382) — and everywhere
 * else the voyage happens under filaments, at noon as at midnight. That is an
 * assertion about the ship, not a setting, and nothing in this file can touch
 * it: an unlit corridor stays black at every hour, because nothing outside those
 * two rooms reads any of this.
 *
 * What the two windows *can* carry is the time, and the time is not invented
 * here either. The walk already projects an event — `selectEvent` under the
 * reader's cap, then `getWorldState` — and the people it puts aboard are aboard
 * *at that hour*: if Kurapika is awake in 1014 at half past one in the morning,
 * the sky behind the bay cannot be a noon sky. So the light follows the same
 * projection the presences do, which is the same argument that forbade
 * re-deriving positions in the browser: one answer, two surfaces reading it.
 *
 * The state the manga draws is the reference, and the others are derived from
 * it rather than the other way round. `WINDOW_GLOW` — the overcast noon of ch.
 * 380 — is `skyOf(13)` exactly, so the walk at the banquet is the walk as it has
 * always been drawn, to the last digit. Dawn and dusk are warm, which the manga
 * does not draw but which a sky does at those hours; they carry the same status
 * as `SEA_GLOW`, derived from a physics nobody disputes and marked as derived.
 *
 * Nothing here reads a clock or an event. The hour is handed in, which is what
 * lets the table be checked minute by minute in a test.
 */
import type { Rgb } from './light'
import { WINDOW_GLOW } from './mesh'

/** How the two windows are burning, at one hour of the ship's day. */
export interface Sky {
  /**
   * What the sky half of the pane burns at, above white — the same claim, and
   * the same reason for it, as `WINDOW_GLOW`.
   */
  glow: Rgb
  /**
   * And the sea half, at 45 % of it, at every hour without exception.
   *
   * `SEA_GLOW` is derived rather than picked: what is below the horizon is the
   * same sky swallowed by water, so the hue is the sky's and only the value
   * falls. That relation is honest at noon and it does not become false at
   * dusk, so it is applied here rather than tabulated — a table would let
   * somebody give the evening a sea of its own and nothing would catch it.
   */
  sea: Rgb
  /**
   * How hard the shafts blow, replacing the constant `SHAFT_PEAK`.
   *
   * Zero at night, and that is not the shafts being switched off: at night the
   * pane is under `uThreshold`, so the march would find nothing to sum whatever
   * this said. Zero is the honest way to say the pass has no work.
   */
  peak: number
  /**
   * `glow` normalised on its strongest channel: the hue of the sky, with the
   * value taken out of it.
   *
   * The shaft pass multiplies what it gathered by this, so it has to be a hue
   * and not a brightness — the brightness is already in the pane the march is
   * reading. Exactly what `uTint` held as a constant.
   */
  tint: Rgb
}

/** One posed hour, from which the rest is interpolated. */
interface SkyState {
  /** Local time aboard, in hours past midnight. */
  at: number
  glow: Rgb
  peak: number
}

/**
 * The table, from the last of the night round to the first of it.
 *
 * Seven states and straight lines between them, in the pattern of `DECK_LIGHT`
 * and `hullRumble`: posed values, linear interpolation, and the dial closed —
 * 21:30 rejoins 05:30 through the night, which is a stretch of eight hours over
 * which nothing changes because nothing outside changes.
 *
 * The single sourced row is 13:00. Every other row is derived, and says so:
 *
 * - 05:30 / 21:30 — the same overcast sky with no sun on it. Not black: a night
 *   at sea under cloud is not a sealed room, and the value is chosen under the
 *   shaft threshold (0.9) and under anything a filament lights, so the pane
 *   becomes what a window is at night — a rectangle barely lighter than its own
 *   lacquer.
 * - 07:00 / 19:30 — the sun low, at the two ends of the day. Warm, which ch. 380
 *   does not draw and which a sky does at those hours. The two are not mirror
 *   images: the evening is the redder of the two, as an evening is.
 * - 10:00 / 17:30 — on the way to and from the reference, and nothing more.
 */
const STATES: readonly SkyState[] = [
  { at: 5.5, glow: [0.03, 0.045, 0.075], peak: 0 },
  { at: 7, glow: [0.98, 0.74, 0.58], peak: 0.4 },
  { at: 10, glow: [0.7, 0.84, 1.18], peak: 0.5 },
  // The one state the manga draws, and it is `WINDOW_GLOW` itself rather than a
  // copy of its digits: the file that bakes the pane stays the one place the
  // reference is written, and this table cannot drift from it.
  { at: 13, glow: WINDOW_GLOW, peak: 0.55 },
  { at: 17.5, glow: [0.74, 0.8, 1.08], peak: 0.5 },
  { at: 19.5, glow: [1.18, 0.64, 0.42], peak: 0.45 },
  { at: 21.5, glow: [0.03, 0.045, 0.075], peak: 0 },
]

/** The hour the walk falls back to: the state ch. 380 draws. See `skyOf`. */
export const REFERENCE_HOUR = 13

/** How much of the sky the water gives back — see `SEA_GLOW`, and `Sky.sea`. */
const SEA_FRACTION = 0.45

const mix = (from: number, to: number, t: number) => from + (to - from) * t

/**
 * Local time aboard, in hours past midnight, from hours since the departure
 * horn.
 *
 * The horn is Sunday at noon, so this is `clockOf`'s own arithmetic with the
 * minutes left on — including the positive modulo, because the arc is full of
 * flashbacks at negative hours and `-3 % 24` is `-3` in JavaScript.
 */
export function timeOfDayOf(voyageHours: number): number {
  return (((voyageHours + 12) % 24) + 24) % 24
}

/**
 * The sky at one hour of the ship's day.
 *
 * The dial is closed, so an hour between the last state and the first is
 * interpolated the long way round through midnight rather than being clamped:
 * three in the morning is night, not the last value in the table.
 */
export function skyOf(timeOfDay: number): Sky {
  const hour = ((timeOfDay % 24) + 24) % 24
  const state = interpolate(hour)
  return {
    glow: state.glow,
    sea: [state.glow[0] * SEA_FRACTION, state.glow[1] * SEA_FRACTION, state.glow[2] * SEA_FRACTION],
    peak: state.peak,
    tint: normalise(state.glow),
  }
}

/** The two posed states an hour falls between, and how far along it is. */
function interpolate(hour: number): { glow: Rgb; peak: number } {
  const last = STATES[STATES.length - 1]!
  const first = STATES[0]!

  // A posed hour is handed back untouched rather than interpolated to itself:
  // `0.7 + (0.62 - 0.7) * 1` is not `0.62` in binary floating point, and the
  // one thing this table owes the reconstruction is that noon is *exactly* the
  // state ch. 380 draws.
  for (const state of STATES) if (hour === state.at) return state

  for (let i = 0; i + 1 < STATES.length; i++) {
    const from = STATES[i]!
    const to = STATES[i + 1]!
    if (hour < from.at || hour > to.at) continue
    return between(from, to, (hour - from.at) / (to.at - from.at))
  }

  // The night, which is the arc the table does not cover: from the last state
  // round midnight to the first. Written as one span so the interpolation is
  // continuous across the wrap rather than jumping at 00:00 — the two ends hold
  // the same value, so what this actually produces is eight hours of night.
  const span = 24 - last.at + first.at
  const along = hour >= last.at ? hour - last.at : 24 - last.at + hour
  return between(last, first, along / span)
}

function between(from: SkyState, to: SkyState, t: number): { glow: Rgb; peak: number } {
  return {
    glow: [
      mix(from.glow[0], to.glow[0], t),
      mix(from.glow[1], to.glow[1], t),
      mix(from.glow[2], to.glow[2], t),
    ],
    peak: mix(from.peak, to.peak, t),
  }
}

/** A colour reduced to its hue, by its strongest channel. */
function normalise(glow: Rgb): Rgb {
  const peak = Math.max(glow[0], glow[1], glow[2])
  if (!(peak > 0)) return [0, 0, 0]
  return [glow[0] / peak, glow[1] / peak, glow[2] / peak]
}

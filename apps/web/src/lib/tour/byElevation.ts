/**
 * Reading a mix decision off the deck the visitor is standing on.
 *
 * Two things aboard are dosed by height and by nothing else: the machinery,
 * which is in the bottom of the hull and gets quieter with every deck climbed
 * (`hullRumble` in `./atmosphere`), and the sea, which is at the waterline and
 * is loudest there (`seaOutside` in `./sea`). Both are written out as a handful
 * of pairs rather than computed, because neither is a measurement — see the
 * notes on `HULL_DECKS` and `SEA_DECKS`, which say so at length.
 *
 * What they do share is the arithmetic between the pairs, and it was written
 * once already. It is here so the second curve does not copy it, and so a band
 * that is *not* monotone — the sea rises to the waterline and falls again above
 * it — reads the same way as one that is.
 */

/** One deck's worth of a dosed sound: how loud it is there, and how dull. */
export interface Band {
  /** Metres above the blueprint's zero, which is the bottom of Tier 5. */
  elevation: number
  /** A fraction of whatever gain the voice is mixed at. */
  level: number
  /** The corner frequency of the lowpass it is heard through, in hertz. */
  cutoff: number
}

/**
 * The band at an elevation, interpolated between the two around it.
 *
 * Linear in elevation, and flat outside the range at both ends: there is
 * nothing under the lowest deck and nothing over the highest, so a visitor
 * pushed below or above the hull hears the nearest deck rather than an
 * extrapolation off the end of a table of five entries.
 *
 * `bands` must be sorted by elevation and hold at least one entry. Both are
 * true of the two tables that call this and are asserted by their tests rather
 * than checked here: this runs on every change of deck and the callers are two
 * constants in this same folder.
 */
export function atElevation(bands: readonly Band[], elevation: number): Omit<Band, 'elevation'> {
  const first = bands[0]
  const last = bands[bands.length - 1]
  // Written as a negated `>` rather than as `<=` so that a NaN elevation — which
  // the walk cannot produce, but a saved position could — lands on the first
  // band instead of falling through the loop and out of the bottom.
  if (!(elevation > first.elevation)) return { level: first.level, cutoff: first.cutoff }
  if (elevation >= last.elevation) return { level: last.level, cutoff: last.cutoff }

  for (let i = 1; i < bands.length; i++) {
    const above = bands[i]
    if (elevation > above.elevation) continue
    const below = bands[i - 1]
    const t = (elevation - below.elevation) / (above.elevation - below.elevation)
    return {
      level: below.level + (above.level - below.level) * t,
      cutoff: below.cutoff + (above.cutoff - below.cutoff) * t,
    }
  }
  return { level: last.level, cutoff: last.cutoff }
}

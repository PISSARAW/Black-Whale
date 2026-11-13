/**
 * The sensory register of a deck, expressed once for every consumer.
 *
 * These are mix and rendering decisions, not facts added to the blueprint. The
 * same five elevations already drive the hull and the sea; keeping maintenance,
 * ventilation and perceived crowding on one curve prevents audio, air and
 * surfaces from inventing three different class systems for the same ship.
 */

export interface TierSignature {
  /** How much ordinary use has marked the deck, from pristine to heavily worn. */
  wear: number
  /** How much residue the deck tends to retain. */
  soil: number
  /** How stale or particulate the supplied air feels. */
  airLoad: number
  /** The non-literal pressure of the ship's unseen population. */
  humanDensity: number
  /** How steady the ventilation plant sounds. */
  ventilationStability: number
}

interface TierSignatureBand extends TierSignature {
  elevation: number
}

/** Physical deck anchors, bottom to top, in blueprint metres. */
export const TIER_SIGNATURES: readonly TierSignatureBand[] = [
  {
    elevation: 0,
    wear: 0.92,
    soil: 0.88,
    airLoad: 0.9,
    humanDensity: 0.9,
    ventilationStability: 0.24,
  },
  {
    elevation: 31.5,
    wear: 0.76,
    soil: 0.7,
    airLoad: 0.72,
    humanDensity: 0.78,
    ventilationStability: 0.42,
  },
  {
    elevation: 63,
    wear: 0.54,
    soil: 0.46,
    airLoad: 0.48,
    humanDensity: 0.62,
    ventilationStability: 0.66,
  },
  {
    elevation: 96,
    wear: 0.3,
    soil: 0.24,
    airLoad: 0.26,
    humanDensity: 0.3,
    ventilationStability: 0.86,
  },
  {
    elevation: 128,
    wear: 0.14,
    soil: 0.1,
    airLoad: 0.13,
    humanDensity: 0.12,
    ventilationStability: 0.96,
  },
]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const mix = (from: number, to: number, at: number) => from + (to - from) * at

function between(
  below: TierSignatureBand,
  above: TierSignatureBand,
  elevation: number,
): TierSignature {
  const span = above.elevation - below.elevation
  const at = span === 0 ? 0 : clamp01((elevation - below.elevation) / span)
  return {
    wear: mix(below.wear, above.wear, at),
    soil: mix(below.soil, above.soil, at),
    airLoad: mix(below.airLoad, above.airLoad, at),
    humanDensity: mix(below.humanDensity, above.humanDensity, at),
    ventilationStability: mix(below.ventilationStability, above.ventilationStability, at),
  }
}

/** Signature at an elevation; interiors inherit the elevation of their deck. */
export function tierSignatureAt(elevation: number): TierSignature {
  const first = TIER_SIGNATURES[0]
  const last = TIER_SIGNATURES[TIER_SIGNATURES.length - 1]
  if (!(elevation > first.elevation)) return between(first, first, first.elevation)
  if (elevation >= last.elevation) return between(last, last, last.elevation)

  for (let index = 1; index < TIER_SIGNATURES.length; index++) {
    const above = TIER_SIGNATURES[index]
    if (elevation > above.elevation) continue
    return between(TIER_SIGNATURES[index - 1], above, elevation)
  }
  return between(last, last, last.elevation)
}

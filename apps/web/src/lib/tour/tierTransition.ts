export interface TierTransition {
  from: number
  to: number
  elapsed: number
  duration: number
}

export interface TierTransitionFrame {
  transition: TierTransition | null
  /** Multiplier composed with the visitor's own exposure. */
  exposure: number
}

/** Starts only for a real change of physical elevation. */
export function beginTierTransition(from: number, to: number): TierTransition | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || Math.abs(to - from) < 0.1) return null
  return {
    from,
    to,
    elapsed: 0,
    // Darkness takes longer to readapt to than glare takes to clear.
    duration: to < from ? 1.15 : 0.82,
  }
}

/** Frame-rate-independent optical adaptation at the existing level seam. */
export function stepTierTransition(
  transition: TierTransition | null,
  delta: number,
): TierTransitionFrame {
  if (!transition) return { transition: null, exposure: 1 }
  const elapsed = Math.max(0, transition.elapsed + Math.max(0, delta))
  const progress = Math.min(1, elapsed / transition.duration)
  const distance = Math.min(1, Math.abs(transition.to - transition.from) / 32)
  const ascending = transition.to > transition.from

  const exposure = ascending
    ? 1 + Math.sin(progress * Math.PI) * 0.24 * distance
    : 0.58 + Math.pow(progress, 0.62) * 0.42

  return {
    transition: progress >= 1 ? null : { ...transition, elapsed },
    exposure,
  }
}

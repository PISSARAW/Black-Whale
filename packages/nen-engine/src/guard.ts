export const PARRY_WINDOW_FRAMES = 6
export const PARRY_RYU_FOCUS = 0.76

export interface ParryReading {
  blocked: boolean
  readable: boolean
  guardFrames: number
  bonusFrames?: number
}

/** A guard becomes a parry only while the readable impact is inside its timing window. */
export function resolvesParry(reading: ParryReading): boolean {
  const window = PARRY_WINDOW_FRAMES + Math.max(0, reading.bonusFrames ?? 0)
  return (
    reading.blocked && reading.readable && reading.guardFrames > 0 && reading.guardFrames <= window
  )
}

export interface RyuFocus<Zone extends string> {
  zones: readonly Zone[]
  focus: Zone
  focusShare?: number
}

/** Concentrates Ryū on one zone and divides the reserve evenly over the others. */
export function focusedRyuDistribution<Zone extends string>({
  zones,
  focus,
  focusShare = PARRY_RYU_FOCUS,
}: RyuFocus<Zone>): Record<Zone, number> {
  const safeFocus = Math.min(1, Math.max(0, focusShare))
  const rest = zones.length > 1 ? (1 - safeFocus) / (zones.length - 1) : 0
  return Object.fromEntries(
    zones.map((zone) => [zone, zone === focus ? safeFocus : rest]),
  ) as Record<Zone, number>
}

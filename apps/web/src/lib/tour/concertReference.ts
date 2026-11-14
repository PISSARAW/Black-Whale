import type { ConcertLandscapeSpec } from './concertLandscapeWalk'
import type { Vec2 } from './types'

/**
 * Ch. 383 reference composition: Melody is centred beyond a low flowered
 * foreground, with the valley opening behind her and both ranges framing her.
 */
export const CONCERT_REFERENCE = {
  distance: 21,
  eyeHeight: 1.35,
  /** Three.js looks down -Z, so PI faces the valley's authored +Z opening. */
  heading: Math.PI,
  pitch: 0.035,
  melodyScreenHeight: 0.31,
  horizonScreenHeight: 0.47,
} as const

export function concertReferencePosition(spec: ConcertLandscapeSpec): Vec2 {
  return [spec.origin[0], spec.origin[1] - CONCERT_REFERENCE.distance]
}

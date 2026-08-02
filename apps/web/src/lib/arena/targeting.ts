import type { BodyZone } from '../combat/types'

/** Maps the first-person camera elevation to the opponent's visible body band. */
export function zoneFromPitch(pitch: number): BodyZone {
  if (pitch > 0.22) return 'legs'
  if (pitch < -0.22) return 'head'
  if (Math.abs(pitch) < 0.08) return 'torso'
  return 'arms'
}

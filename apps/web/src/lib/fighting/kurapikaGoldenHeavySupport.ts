import type { PhaseFrames } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'

export interface GoldenHeavySupport {
  supportFoot: 'lead'
  pivotFoot: 'rear'
  pivotAngle: number
}

/** Lead-foot base with a rear-heel pivot that peaks at contact and unwinds in recovery. */
export function kurapikaGoldenHeavySupport(
  fighter: ArcadeFighter,
  frames: PhaseFrames,
): GoldenHeavySupport | null {
  if (fighter.id !== 'kurapika' || fighter.attack?.moveId !== 'kurapika:standingHeavy') return null
  const frame = fighter.attack.frame
  const contact = frames.startup
  const recovery = Math.max(0, frame - frames.startup - frames.active)
  const load = smooth(Math.min(1, frame / Math.max(1, contact)))
  const release = 1 - smooth(Math.min(1, recovery / Math.max(1, frames.recovery * 0.72)))
  return { supportFoot: 'lead', pivotFoot: 'rear', pivotAngle: 0.24 * load * release }
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value)
}

import type { PhaseFrames } from './keyPoseTimeline'
import type { MoveSlot } from './types'

const LEAD_SUPPORT = new Set<MoveSlot>(['standingHeavy', 'forwardHeavy', 'forwardLight'])
const PIVOT: Partial<Record<MoveSlot, number>> = {
  forwardHeavy: 0.22,
  backHeavy: 0.16,
  standingHeavy: 0.2,
  forwardLight: 0.15,
}

export function groundedStrikeSupport(slot: MoveSlot, frame: number, frames: PhaseFrames) {
  const supportFoot = LEAD_SUPPORT.has(slot) ? 'lead' : 'rear'
  const pivotFoot = supportFoot === 'lead' ? 'rear' : 'lead'
  const load = smooth(Math.min(1, frame / Math.max(1, frames.startup)))
  const recovery = Math.max(0, frame - frames.startup - frames.active)
  const release = 1 - smooth(Math.min(1, recovery / Math.max(1, frames.recovery * 0.72)))
  return { supportFoot, pivotFoot, pivotAngle: (PIVOT[slot] ?? 0.1) * load * release } as const
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value)
}

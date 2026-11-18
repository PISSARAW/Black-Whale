import { HANZO_BLADE_POSES } from './keyPosesHanzoBlade'
import { HANZO_PHYSICAL_POSES } from './keyPosesHanzoPhysical'
import type { FightPose } from './fightPose'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

export const HANZO_FLOAT_POSE: FightPose = {
  root: [0, 0.06, 0],
  chest: [0.03, -0.25, 0],
  leadShoulder: [-0.6, 0, 0.15],
  rearShoulder: [0.25, 0, -0.15],
  leadElbow: [-0.4, 0, 0],
  rearElbow: [-0.5, 0, 0],
  leadHip: [-0.2, 0, 0],
  rearHip: [0.1, 0, 0],
  leadKnee: [0.45, 0, 0],
  rearKnee: [0.6, 0, 0],
}

const CHOKE: FightPose = {
  body: [0.1, 0, 0],
  chest: [0.05, -0.35, 0],
  leadShoulder: [-1.15, 0, 0.4],
  rearShoulder: [-1.05, 0, -0.35],
  leadElbow: [1.5, 0, 0],
  rearElbow: [1.8, 0, 0],
  leadWrist: [0, 0.5, 0],
  rearWrist: [0, -0.5, 0],
}

/** The projected choke of chapter 372, rather than the generic three-strike finisher. */
export const HANZO_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  ...HANZO_PHYSICAL_POSES,
  ...HANZO_BLADE_POSES,
  finisher: [
    { phase: 'startup', at: 0.65, ease: 'out', pose: { chest: [0, 0.2, 0] } },
    { phase: 'active', at: 0, ease: 'snap', pose: CHOKE },
    { phase: 'recovery', at: 0.4, ease: 'smooth', pose: CHOKE },
    { phase: 'recovery', at: 0.8, ease: 'out', pose: { chest: [0, -0.1, 0] } },
  ],
}

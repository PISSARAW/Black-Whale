import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'
import type { FightPose } from './fightPose'

const AIM: FightPose = {
  chest: [0.04, -0.15, 0],
  leadShoulder: [-0.7, 0, 0.1],
  leadElbow: [0.2, 0, 0],
  rearShoulder: [-1.35, 0, -0.1],
  rearElbow: [0.4, 0, 0],
  rearWrist: [0.2, 0, 0],
}
const VACUUM: MoveTimeline = [
  { phase: 'startup', at: 0.7, pose: AIM },
  { phase: 'active', at: 0, pose: AIM },
  { phase: 'active', at: 1, pose: AIM },
  { phase: 'recovery', at: 0.8, pose: {} },
]
export const SHIZUKU_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: VACUUM,
  downSpecial: VACUUM.map((key) => ({ ...key, pose: { ...key.pose, chest: [0.3, -0.15, 0] } })),
  backSpecial: VACUUM,
  finisher: VACUUM,
}

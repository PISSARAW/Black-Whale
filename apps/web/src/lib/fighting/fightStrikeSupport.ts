import { addPoses, scalePose, type FightPose } from './fightPose'
import type { AttackWeightTransfer } from './fightWeightTransfer'
import type { PhaseFrames } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'
import { rosterMotionStyle } from './rosterStrikeMotion'

/** Keep the drive visible at contact, with the hip rotation leading the shoulders and its own braking phase. */
export function strikeSupportPose(
  fighter: ArcadeFighter,
  input: {
    transfer?: AttackWeightTransfer
    frame: number
    frames: PhaseFrames
  },
): FightPose {
  const { transfer, frame, frames } = input
  if (!transfer) return {}
  const p = Math.min(1, Math.max(0, frame / Math.max(1, frames.startup)))
  const recovery = Math.min(
    1,
    Math.max(0, (frame - frames.startup - frames.active) / Math.max(1, frames.recovery)),
  )
  const drive = p * p * (3 - 2 * p) * (1 - recovery * recovery * (3 - 2 * recovery))
  const drivePose: FightPose = rosterMotionStyle(fighter.id)?.drive ?? {}
  const rotation = (drivePose.chest?.[1] ?? -0.12) * 1.3
  const torque: FightPose = {
    body: [0, rotation * 0.35, 0],
    chest: [0, -rotation * 0.18, 0],
    leadHip: [0, rotation * 0.8, 0],
    rearHip: [0, rotation, 0],
    rearKnee: [0.12, 0, 0],
  }
  return addPoses(scalePose(transfer.drive, drive * 0.65), scalePose(torque, drive))
}

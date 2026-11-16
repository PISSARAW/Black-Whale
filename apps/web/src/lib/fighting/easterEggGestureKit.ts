import type { FightPose } from './fightPose'

export interface EggGestureKeys {
  pose: FightPose
  sway: FightPose
  finish: FightPose
}
/** Shoulder pitch, elbow bend, and lateral opening, in the shared fighting rig. */
type Arm = readonly [number, number, number]
export function gesturePose(lead: Arm, rear: Arm, details: FightPose = {}): FightPose {
  return {
    leadShoulder: [lead[0], 0, lead[2]],
    leadElbow: [lead[1], 0, 0],
    rearShoulder: [rear[0], 0, rear[2]],
    rearElbow: [rear[1], 0, 0],
    ...details,
  }
}
export function gestureKeys(
  pose: FightPose,
  sway: FightPose,
  finish: FightPose = {},
): EggGestureKeys {
  return { pose, sway, finish }
}

import type { FightPose, Turn } from '../fightPose'

/** A grounded throw turns through the legs and hips instead of folding a rigid standing body. */
export function balancedThrowPose(pose: FightPose): FightPose {
  return { ...pose, body: balancedTurn(pose.body, 0.32), chest: balancedTurn(pose.chest, 0.24) }
}
function balancedTurn(turn: Turn | undefined, pitch: number): Turn | undefined {
  if (!turn) return undefined
  return [
    Math.max(-pitch, Math.min(pitch, turn[0])),
    turn[1],
    Math.max(-0.14, Math.min(0.14, turn[2])),
  ]
}

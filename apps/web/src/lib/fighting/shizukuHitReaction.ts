import { scalePose, type FightPose } from './fightPose'
import type { ReactionContext } from './fightReactions'

const HAMMER: FightPose = {
  body: [0.28, 0.04, 0],
  chest: [0.38, -0.14, 0.06],
  head: [0.32, 0, 0.12],
  leadShoulder: [0.32, 0, 0.32],
  rearShoulder: [0.3, 0, -0.28],
  leadElbow: [0.65, 0, 0],
  rearElbow: [0.5, 0, 0],
  leadHip: [-0.18, 0, 0],
  leadKnee: [0.52, 0, 0],
  rearKnee: [0.38, 0, 0],
}
const DRIVE: FightPose = {
  body: [-0.18, -0.16, 0.06],
  chest: [-0.28, -0.42, 0.12],
  head: [-0.3, -0.22, 0.14],
  leadShoulder: [0.45, 0, 0.42],
  rearShoulder: [0.25, 0, -0.3],
  leadElbow: [0.85, 0, 0],
  rearElbow: [0.65, 0, 0],
  leadKnee: [0.18, 0, 0],
  rearHip: [-0.18, 0, 0],
  rearKnee: [0.4, 0, 0],
}

/** Compression for the hammer, opening rotation for the driving follow-up. */
export function shizukuHitReaction(context: ReactionContext): FightPose | null {
  if (!context.strikeReaction) return null
  const release = Math.min(1, Math.max(0, (context.progress - 0.45) / 0.55))
  const strength = 1 - release * release * (3 - 2 * release)
  return scalePose(context.strikeReaction === 'blinky-hammer' ? HAMMER : DRIVE, strength)
}

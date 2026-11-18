import { lerpPose, type FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

const GATHER: FightPose = {
  body: [-0.65, -0.08, 0],
  chest: [0.35, -0.12, 0],
  head: [0.15, 0, 0],
  leadHip: [-1.1, 0, 0.1],
  leadKnee: [1.7, 0, 0],
  rearHip: [-0.9, 0, -0.1],
  rearKnee: [1.8, 0, 0],
  leadShoulder: [0.2, 0, 0.65],
  rearShoulder: [0.3, 0, -0.6],
  leadElbow: [-1.1, 0, 0],
  rearElbow: [-1.3, 0, 0],
}
const SUPPORT: FightPose = {
  body: [0.22, 0, 0],
  chest: [-0.08, -0.12, 0],
  leadHip: [-0.65, 0, 0],
  leadKnee: [1.05, 0, 0],
  rearHip: [-0.35, 0, 0],
  rearKnee: [0.8, 0, 0],
  leadShoulder: [-0.35, 0, 0.25],
  rearShoulder: [-0.3, 0, -0.25],
  leadElbow: [-1.2, 0, 0],
  rearElbow: [-1.15, 0, 0],
}

/** Recover before control returns: a buffered reversal can skip the engine's wakeup pose. */
export function groundRecoveryPose(
  fighter: ArcadeFighter,
  progress: number,
  poses: { fallen: FightPose; standing: FightPose },
): FightPose | null {
  if (!recoveringBody(fighter) || progress < 0.52) return null
  const t = Math.min(1, (progress - 0.52) / 0.46)
  if (t < 0.32) return lerpPose(poses.fallen, GATHER, smooth(t / 0.32))
  if (t < 0.68) return lerpPose(GATHER, SUPPORT, smooth((t - 0.32) / 0.36))
  return lerpPose(SUPPORT, poses.standing, smooth((t - 0.68) / 0.32))
}

function recoveringBody(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.y <= 0 &&
    fighter.knockdownFrames > 0 &&
    !fighter.arsenalSleep &&
    !fighter.halkSoulSleep
  )
}

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

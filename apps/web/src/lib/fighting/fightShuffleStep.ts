import type { ArcadeFighter } from './types'
import type { FightPose } from './fightPose'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import { FIGHT_WORLD_X } from './fightCoordinates'
import { motionOf } from './fighterMovement'

/** Shorter legs take shorter steps; cadence follows travelled ground. */
export function shuffleStride(fighter: ArcadeFighter): number {
  return 1.04 * Math.min(1.4, Math.max(0.55, fightPhysicalProfile(fighter).height / 1.8))
}
export function shufflePhase(fighter: ArcadeFighter): number {
  return (fighter.x * FIGHT_WORLD_X * fighter.facing * Math.PI * 2) / shuffleStride(fighter)
}
export function shufflePose(fighter: ArcadeFighter): FightPose {
  const wave = Math.sin(shufflePhase(fighter)),
    a = Math.max(0, wave),
    b = Math.max(0, -wave)
  return {
    root: [0, -0.014 * Math.abs(wave), 0],
    leadHip: [-0.14 * a, 0, 0],
    leadKnee: [0.28 * a, 0, 0],
    rearHip: [-0.12 * b, 0, 0],
    rearKnee: [0.24 * b, 0, 0],
  }
}
export function shuffleSupport(fighter: ArcadeFighter) {
  const lead = fighter.facing === 1 ? 1 : 0
  const phase = (((shufflePhase(fighter) / (Math.PI * 2)) % 1) + 1) % 1
  const free = phase < 0.5 ? lead : 1 - lead
  const direction = motionOf(fighter).heldDirection || fighter.facing
  const progress = (phase % 0.5) * 2
  return {
    support: 1 - free,
    free,
    pivot: 0,
    progress: direction === fighter.facing ? progress : 1 - progress,
    direction,
    step: shuffleStride(fighter) / 2,
  }
}

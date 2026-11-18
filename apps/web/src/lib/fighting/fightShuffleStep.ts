import type { ArcadeFighter } from './types'
import type { FightPose } from './fightPose'

/** Five duel units per complete step-drag: the phase follows travelled ground. */
export function shufflePhase(fighter: ArcadeFighter): number {
  return fighter.x * fighter.facing * Math.PI * 0.4
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
  const free = Math.sin(shufflePhase(fighter)) >= 0 ? lead : 1 - lead
  return { support: 1 - free, free, pivot: 0 }
}

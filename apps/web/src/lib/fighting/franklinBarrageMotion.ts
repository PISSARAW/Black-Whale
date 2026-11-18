import { franklinNenAvailable, usesFranklinBarrage, FRANKLIN_SHOT_INTERVAL } from './franklinAttack'
import type { AttackMotionOptions } from './fightAttackMotion'
import type { FightPose } from './fightPose'

/** Recoil belongs to a bullet actually emitted, never to an assumed firing timer. */
export function franklinBarrageMotion(options: AttackMotionOptions): FightPose | null {
  const { fighter, frames } = options
  if (!presentsBarrage(fighter)) return null
  const emitted = fighter.attack!.projectilesSpawned ?? 0
  const frame = options.frame ?? fighter.attack!.frame
  const age = frame - (frames.startup + (emitted - 1) * FRANKLIN_SHOT_INTERVAL)
  if (emitted === 0 || age < 0 || age >= 4 || frame >= frames.startup + frames.active) return {}
  const pulse = (1 - age / 4) ** 2
  const arm = (emitted - 1) % 2 === 0 ? 'lead' : 'rear'
  return {
    body: [-0.025 * pulse, 0, 0],
    chest: [-0.04 * pulse, (arm === 'lead' ? 1 : -1) * 0.025 * pulse, 0],
    [`${arm}Shoulder`]: [0.055 * pulse, 0, 0],
    [`${arm}Elbow`]: [-0.09 * pulse, 0, 0],
    leadKnee: [0.025 * pulse, 0, 0],
    rearKnee: [0.035 * pulse, 0, 0],
  }
}

function presentsBarrage(fighter: AttackMotionOptions['fighter']): boolean {
  return fighter.id === 'franklin' && usesFranklinBarrage(fighter) && franklinNenAvailable(fighter)
}

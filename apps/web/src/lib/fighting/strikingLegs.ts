import type { FightPose } from './fightPose'
import type { FighterId } from './types'

/**
 * Upright and wide stances leave the weight transfer nothing to bend: the torso swings
 * while both feet stay glued under the hips. That is especially visible on the large
 * silhouettes of Benjamin, Franklin, Beyond, Halkenburg and Terebellum.
 *
 * They strike from a lunge instead: lead foot well forward, rear leg long behind. The
 * attack fades in from the idle stance during startup (`flowIntoAttack`), so each blow
 * opens with a real step and the recovery brings the feet back together.
 * Signs follow `fightPose.ts`: hips x < 0 swing forward, knees x > 0 bend.
 */
const LUNGE_LEGS: FightPose = {
  leadHip: [-0.46, 0, 0.06],
  leadKnee: [0.42, 0, 0],
  rearHip: [0.3, 0, -0.05],
  rearKnee: [0.12, 0, 0],
}
const STRIKE_FROM_LUNGE = new Set<FighterId>([
  'benjamin',
  'tserriednich',
  'franklin',
  'beyond',
  'halkenburg',
  'terebellum',
  'biscuit',
])

export function strikingStance(id: FighterId, standing: FightPose): FightPose {
  return STRIKE_FROM_LUNGE.has(id) ? { ...standing, ...LUNGE_LEGS } : standing
}

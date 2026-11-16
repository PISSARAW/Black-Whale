import type { ArcadeFighter } from './types'
import type { BodyPlan } from './fightPose'

export function pluggingWoundsPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (!fighter.pluggingWounds) return null
  return {
    key: 'plug-open-wounds',
    plant: fighter.y === 0,
    blend: 0.08,
    pose: {
      chest: [0.12, 0, 0],
      leadShoulder: [-0.7, 0.15, 0.2],
      leadElbow: [-1.6, 0, 0],
      rearShoulder: [-0.7, -0.15, -0.2],
      rearElbow: [-1.6, 0, 0],
    },
  }
}

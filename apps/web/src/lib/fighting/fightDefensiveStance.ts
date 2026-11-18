import { addPoses, type FightPose } from './fightPose'
/** Keep the character's own guard and weapon position; both arms absorb a short impact. */
export function defensiveStance(standing: FightPose): FightPose {
  return addPoses(standing, {
    chest: [-0.04, 0, 0],
    leadShoulder: [-0.12, 0, -0.03],
    rearShoulder: [-0.1, 0, 0.03],
    leadElbow: [-0.16, 0, 0],
    rearElbow: [-0.18, 0, 0],
  })
}

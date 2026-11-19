import { chrolloNenActive } from './chrolloBook'
import { addPoses, type FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

/** Closing the book frees its anatomical right forearm before attacks and locomotion are added. */
export function chrolloBodyStance(fighter: ArcadeFighter, standing: FightPose): FightPose {
  if (fighter.id !== 'chrollo') return standing
  if (fighter.chrolloBook?.open && chrolloNenActive(fighter)) return standing
  return addPoses(standing, {
    leadShoulder: [0.44, 0, 0.02],
    leadElbow: [1.28, 0, 0],
    leadWrist: [0.18, 0, 0],
  })
}

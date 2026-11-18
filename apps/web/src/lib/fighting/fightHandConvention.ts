import { bodyguardFiring } from './bodyguardFirearms'
import type { ArcadeFighter } from './types'

/** Keep equipment on the anatomical hand used by the existing authored rig. */
export function usesRightHandPose(fighter: ArcadeFighter, key: string): boolean {
  if (key === 'padaille-cuff-escape') return false
  return (
    ['chrollo', 'kurapika', 'luini', 'shizuku'].includes(fighter.id) ||
    bodyguardFiring(fighter) ||
    key === 'roster-writing' ||
    key === 'roster-console'
  )
}

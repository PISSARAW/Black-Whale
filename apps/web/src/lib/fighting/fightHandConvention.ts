import { hanzoBladeAttack } from './hanzoBlade'
import { bodyguardFiring } from './bodyguardFirearms'
import type { ArcadeFighter } from './types'

/** Keep equipment on the anatomical hand used by the existing authored rig. */
export function usesRightHandPose(fighter: ArcadeFighter, key: string): boolean {
  if (key === 'padaille-cuff-escape') return false
  if (key === 'attack:kurapika:standingHeavy') return false
  if (hanzoBladeAttack(fighter)) return true
  if (fighter.id === 'bonolenov' && fighter.battleCantabile?.prologue) return true
  return (
    ['chrollo', 'kurapika', 'luini', 'shizuku', 'kalluto', 'theta'].includes(fighter.id) ||
    bodyguardFiring(fighter) ||
    key === 'roster-writing' ||
    key === 'roster-console'
  )
}

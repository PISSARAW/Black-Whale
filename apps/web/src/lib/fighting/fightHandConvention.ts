import { bodyguardFiring } from './bodyguardFirearms'
import type { ArcadeFighter } from './types'

/** Keep equipment on the anatomical hand used by the existing authored rig. */
export function usesRightHandPose(fighter: ArcadeFighter, key: string): boolean {
  if (key === 'padaille-cuff-escape') return false
  if (fighter.id === 'bonolenov' && fighter.battleCantabile?.prologue) return true
  return (
    ['chrollo', 'kurapika', 'luini', 'shizuku', 'kalluto'].includes(fighter.id) ||
    bodyguardFiring(fighter) ||
    key === 'roster-writing' ||
    key === 'roster-console'
  )
}

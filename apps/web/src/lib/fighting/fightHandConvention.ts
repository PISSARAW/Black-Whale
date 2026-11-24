import { hanzoBladeAttack } from './hanzoBlade'
import { bodyguardFiring, bodyguardPistolStrike } from './bodyguardFirearms'
import type { ArcadeFighter } from './types'

const PADAILLE_RIGHT_ARM = new Set([
  'attack:padaille:standingHeavy',
  'attack:padaille:forwardLight',
  'attack:padaille:forwardHeavy',
  'attack:padaille:airHeavy',
])

/** Keep equipment on the anatomical hand used by the existing authored rig. */
export function usesRightHandPose(fighter: ArcadeFighter, key: string): boolean {
  if (fighter.id === 'padaille') return PADAILLE_RIGHT_ARM.has(key)
  if (key === 'attack:kurapika:standingHeavy') return false
  if (hanzoBladeAttack(fighter)) return true
  if (fighter.id === 'bonolenov' && fighter.battleCantabile?.prologue) return true
  return (
    ['chrollo', 'kurapika', 'luini', 'shizuku', 'kalluto', 'theta', 'gel'].includes(fighter.id) ||
    bodyguardFiring(fighter) ||
    bodyguardPistolStrike(fighter) ||
    key === 'roster-writing' ||
    key === 'roster-console'
  )
}

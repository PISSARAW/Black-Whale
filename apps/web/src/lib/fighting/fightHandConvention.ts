import { hanzoBladeAttack } from './hanzoBlade'
import { bodyguardFiring, bodyguardPistolStrike } from './bodyguardFirearms'
import { padailleRightStrike } from './padailleNormalTools'
import type { ArcadeFighter } from './types'

const ASYMMETRIC_LOCOMOTION = new Set([
  'stance',
  'walk:forward',
  'walk:backward',
  'guard',
  'crouch',
  'prejump',
  'jump',
  'landing',
])

/** Keep equipment on the anatomical hand used by the existing authored rig. */
export function usesRightHandPose(fighter: ArcadeFighter, key: string): boolean {
  if (fighter.id === 'padaille')
    return ASYMMETRIC_LOCOMOTION.has(key) || padailleRightStrike(key.replace(/^attack:/, ''))
  if (fighter.id === 'terebellum' && ASYMMETRIC_LOCOMOTION.has(key)) return true
  if (key === 'attack:kurapika:standingHeavy') return false
  return (
    ['chrollo', 'kurapika', 'luini', 'shizuku', 'kalluto', 'theta', 'gel'].includes(fighter.id) ||
    usesRightHandEquipment(fighter) ||
    key === 'roster-writing' ||
    key === 'roster-console'
  )
}

function usesRightHandEquipment(fighter: ArcadeFighter): boolean {
  return (
    hanzoBladeAttack(fighter) ||
    (fighter.id === 'bonolenov' && Boolean(fighter.battleCantabile?.prologue)) ||
    bodyguardFiring(fighter) ||
    bodyguardPistolStrike(fighter)
  )
}

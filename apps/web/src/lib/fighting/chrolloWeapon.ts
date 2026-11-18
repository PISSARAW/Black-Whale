import type { ArcadeFighter } from './types'
import { chrolloNenActive } from './chrolloBook'

/** The book occupies the right hand. The physical knife uses the other available hand. */
export function chrolloKnifeHand(fighter: ArcadeFighter): 'left' | 'right' {
  return fighter.chrolloBook?.open && chrolloNenActive(fighter) ? 'left' : 'right'
}

/** Kicks and elbow strikes cannot transmit the knife's poison. */
export function chrolloKnifeContact(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack) return false
  const slot = attack.moveId?.split(':')[1]
  return slot
    ? ['standingLight', 'lowLight', 'airLight', 'forwardLight', 'backHeavy'].includes(slot)
    : attack.kind === 'light'
}

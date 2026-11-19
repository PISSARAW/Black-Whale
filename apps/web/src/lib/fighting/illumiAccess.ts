import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hasIllumiNeedles } from './illumiEquipment'
import { illumiBodyFree, ILLUMI_IMPLANT } from './illumiState'
import { illumiDisguiseAvailable } from './illumiDisguise'
import type { ArcadeFighter } from './types'

export function illumiNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter) && !chainAbilitySealed(fighter, ILLUMI_IMPLANT)
}

export function ownsIllumiNeedles(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'illumi') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'illumi')
  return fighter.kurapika?.held?.used === true && fighter.kurapika.held.source === 'illumi'
}

export function illumiMove(fighter: ArcadeFighter, moveId?: string): boolean {
  if (fighter.id === 'illumi') return true
  if (fighter.id === 'chrollo') return chrolloPageForMove(fighter, moveId) === 'illumi'
  return (
    fighter.kurapika?.held?.used === true &&
    fighter.kurapika.held.moveId === moveId &&
    fighter.kurapika.held.source === 'illumi'
  )
}

export function illumiAvailable(fighter: ArcadeFighter): boolean {
  return (
    illumiNenActive(fighter) &&
    ownsIllumiNeedles(fighter) &&
    !chainAbilitySealed(fighter, ILLUMI_IMPLANT) &&
    hasIllumiNeedles(fighter)
  )
}

/** Null leaves other Hatsu and physical moves to their own resource checks. */
export function illumiResources(fighter: ArcadeFighter, moveId?: string): boolean | null {
  if (!illumiMove(fighter, moveId)) return null
  const available =
    moveId === 'illumi:backSpecial' ? illumiDisguiseAvailable(fighter) : illumiAvailable(fighter)
  return illumiBodyFree(fighter) && available
}

import { canUseHatsu } from '@black-whale/nen-engine'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hatsuSealedByOn } from './onTechnique'
import { predatorNenLocked } from './predatorSeal'
import { hasIllumiNeedles } from './illumiEquipment'
import { illumiBodyFree, ILLUMI_IMPLANT } from './illumiState'
import type { ArcadeFighter } from './types'

export function illumiNenActive(fighter: ArcadeFighter): boolean {
  return (
    canUseHatsu(fighter.nen) &&
    !fighter.auraExhausted &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    !hatsuSealedByOn(fighter) &&
    !predatorNenLocked(fighter) &&
    fighter.health > 0
  )
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
  return illumiBodyFree(fighter) && illumiAvailable(fighter)
}

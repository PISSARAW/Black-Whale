import { FIGHT_CATEGORIES, fightCategoryEfficiency } from './nenCategories'
import type { ActiveNenCategory } from '@black-whale/nen-engine'
import type { ArcadeFighter, FighterId, FightSide } from './types'

/** The stolen aura retains its donor's quality. It is neither the recipient's mastery nor ET. */
export interface DolphinAuraSupply {
  originalOwner: FighterId
  amount: number
  efficiencies: Record<ActiveNenCategory, number>
}
export function captureDolphinAura(fighter: ArcadeFighter): DolphinAuraSupply {
  // Capacity is recorded before the syringe suppresses the victim's voluntary Nen.
  const available: ArcadeFighter = { ...fighter, nen: { ...fighter.nen, mode: 'ten' } }
  return {
    originalOwner: fighter.nenOwner ?? fighter.id,
    amount: 0,
    efficiencies: Object.fromEntries(
      FIGHT_CATEGORIES.map((category) => [category, fightCategoryEfficiency(available, category)]),
    ) as Record<ActiveNenCategory, number>,
  }
}

export interface StealChainDrain {
  owner: FightSide
  ownerMember?: number
  supply?: DolphinAuraSupply
}

import { canUseHatsu } from '@black-whale/nen-engine'
import type { ArcadeFighter } from './types'

/** Shared gameplay contract for every roster Hatsu. */
export const FIGHT_HATSU_AURA_COST = 40

export function canUseFightHatsu(
  fighter: Pick<ArcadeFighter, 'aura' | 'nen'>,
): boolean {
  return fighter.aura >= FIGHT_HATSU_AURA_COST && canUseHatsu(fighter.nen)
}

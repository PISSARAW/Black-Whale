import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilityGroup } from './chainAbilityGroup'
import type { ArcadeFighter } from './types'

/** A retained Hatsu may have several commands; a different Hatsu from the same person is separate. */
export function chrolloAbilityActive(fighter: ArcadeFighter, moveId: string): boolean {
  if (fighter.id !== 'chrollo') return true
  const source = moveId.split(':')[0]
  return Boolean(
    fighter.chrolloBook?.pages.some(
      (page) =>
        chrolloHasActivePage(fighter, page) &&
        (page === source || chainAbilityGroup(page) === chainAbilityGroup(moveId)),
    ),
  )
}

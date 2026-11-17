import { copiedHandsAvailable } from './chrolloCopiedAction'
import { chrolloHasActivePage, chrolloPageSource } from './chrolloBook'
import { chainAbilityGroup } from './chainAbilityGroup'
import { movesetFor, canUseMovesetMove } from './movesets'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function copiedArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const fighter = state[side]
  if (fighter.id !== 'chrollo') return []
  const pages =
    fighter.chrolloBook?.pages.filter(
      (page) => page.includes(':') && chrolloHasActivePage(fighter, page),
    ) ?? []
  return pages.flatMap((page) => {
    const source = chrolloPageSource(page)
    if (!source) return []
    const actor = { ...fighter, id: source, nenOwner: fighter.id }
    return (movesetFor(source)?.moves ?? [])
      .filter(
        (move) =>
          ['special', 'finisher'].includes(move.category) &&
          chainAbilityGroup(move.id) === chainAbilityGroup(page),
      )
      .map((move) => ({
        command: { action: 'copied-move' as const, target: move.id },
        labelFr: `Page · ${move.nameFr}`,
        labelEn: `Page · ${move.nameEn}`,
        ready:
          copiedHandsAvailable(fighter, source) &&
          canUseMovesetMove({ ...state, [side]: actor }, side, move),
        conditionFr:
          'Même Hatsu retenu ; conditions, mains, corps et équipement de cette application requis.',
        conditionEn:
          'Same retained Hatsu; this application’s conditions, hands, body and equipment are required.',
      }))
  })
}

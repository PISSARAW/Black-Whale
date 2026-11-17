import { arsenalAttackSlots } from './arsenalAi'
import { chrolloHasActivePage, chrolloPageSource } from './chrolloBook'
import { chainAbilityGroup } from './chainAbilityGroup'
import { copiedHandsAvailable, performChrolloSelectedMove } from './chrolloCopiedAction'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { perceivedOpponentGap } from './opponentAwareness'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** Reuse the original Hatsu's plan, then execute only applications belonging to the active stolen ability. */
export function copiedArsenalAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  if (actor.id !== 'chrollo') return null
  const pages =
    actor.chrolloBook?.pages.filter(
      (page) => page.includes(':') && chrolloHasActivePage(actor, page),
    ) ?? []
  for (const page of pages) {
    const selected = copiedPageAi(state, page)
    if (!selected) continue
    const cast = performChrolloSelectedMove({ state, side: 'opponent', moveId: selected }, perform)
    if (cast !== state) return cast
  }
  return null
}
function copiedPageAi(state: FightState, page: import('./chrolloBook').ChrolloPage): string | null {
  const source = chrolloPageSource(page)
  if (!source || !copiedHandsAvailable(state.opponent, source)) return null
  const prepared = {
    ...state,
    opponent: { ...state.opponent, id: source, nenOwner: state.opponent.id },
  }
  const slots = arsenalAttackSlots({
    state: prepared,
    roll: (state.frame % 120) / 120,
    gap: perceivedOpponentGap(state),
  })
  for (const slot of slots) {
    const move = moveForSlot(source, slot)
    if (!move || !['special', 'finisher'].includes(move.category)) continue
    if (chainAbilityGroup(move.id) !== chainAbilityGroup(page)) continue
    if (canUseMovesetMove(prepared, 'opponent', move)) return move.id
  }
  return null
}

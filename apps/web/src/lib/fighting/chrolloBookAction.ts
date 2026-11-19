import {
  chrolloBookMove,
  toggleChrolloBookmark,
  turnChrolloPage,
  CHROLLO_TURN,
} from './chrolloBook'
import { canStartFighterAttack, startFighterAttack } from './fighterAttacks'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { skillHunterBookHandReady } from './historicalHands'
import type { AttackKind, FightSide, FightState } from './types'

/** Book handling has recovery, but never a hitbox, a lunge, or a free hit cancel. */
export function performChrolloBookAction(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (fighter.id !== 'chrollo' || kind !== 'special' || !chrolloBookMove(moveId)) return null
  if (!skillHunterBookHandReady(state, side)) return state
  if (fighter.attack || fighter.y > 0 || !canStartFighterAttack(fighter, kind, moveId)) return state
  const book = fighter.chrolloBook!
  const changed = moveId === CHROLLO_TURN ? turnChrolloPage(book) : toggleChrolloBookmark(book)
  const next = {
    ...state,
    [side]: {
      ...startFighterAttack({ fighter, kind, moveId, auraCharged: false, concealed: false }),
      chrolloBook: changed,
    },
  }
  return reconcileChrolloPages(state, next, side)
}

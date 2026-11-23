import {
  chrolloBookMove,
  selectChrolloSlot,
  toggleChrolloBookmark,
  turnChrolloPage,
  CHROLLO_STEAL,
  CHROLLO_TURN,
  type BookSlot,
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
  if (fighter.id !== 'chrollo' || kind !== 'special') return null
  const book = fighter.chrolloBook
  const recyclingStolen = moveId === CHROLLO_STEAL && Boolean(book?.stolenPage)
  if (!chrolloBookMove(moveId) && !recyclingStolen) return null
  if (!skillHunterBookHandReady(state, side)) return state
  const effectiveMoveId = recyclingStolen ? CHROLLO_TURN : moveId
  if (fighter.attack || fighter.y > 0 || !canStartFighterAttack(fighter, kind, effectiveMoveId))
    return state
  const changed = recyclingStolen
    ? selectChrolloSlot(book!, 'stolen')
    : moveId === CHROLLO_TURN
      ? { ...turnChrolloPage(book!), isFlipping: true }
      : toggleChrolloBookmark(book!)
  const next = {
    ...state,
    [side]: {
      ...startFighterAttack({
        fighter,
        kind,
        moveId: effectiveMoveId,
        auraCharged: false,
        concealed: false,
      }),
      chrolloBook: changed,
    },
  }
  return reconcileChrolloPages(state, next, side)
}

/** Direct slot pick while 4S (Feuilletage) is held. */
export function pickChrolloFlipSlot(
  state: FightState,
  side: FightSide,
  slot: BookSlot,
): FightState | null {
  const fighter = state[side]
  const book = fighter.chrolloBook
  if (fighter.id !== 'chrollo' || !book?.isFlipping) return null
  const changed = selectChrolloSlot(book, slot)
  const next = { ...state, [side]: { ...fighter, chrolloBook: changed } }
  return reconcileChrolloPages(state, next, side)
}

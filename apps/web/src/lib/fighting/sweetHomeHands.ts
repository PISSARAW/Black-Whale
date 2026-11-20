import { boxesOverlap, hurtboxes } from './frameData'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Contact uses a short hand box, never the special's much longer attack box. */
export const SWEET_HOME_HAND_REACH = 5

/** Specials whose right hand is held out to receive someone else's wound. */
const RIGHT_HAND_MOVES: ReadonlySet<string> = new Set([
  'terebellum:forwardSpecial',
  'terebellum:downSpecial',
])

const ALLY_ON_STAGE: ReadonlySet<string> = new Set(['entering', 'acting', 'leaving'])

export function sweetHomeHandBox(owner: ArcadeFighter) {
  const handX = owner.x + owner.facing * SWEET_HOME_HAND_REACH
  const handY = owner.y + (owner.crouching ? 4 : 7)
  return {
    left: Math.min(owner.x, handX),
    right: Math.max(owner.x, handX),
    bottom: handY - 1,
    top: handY + 1,
  }
}

export function sweetHomeHandTouches(owner: ArcadeFighter, body: ArcadeFighter): boolean {
  const hand = sweetHomeHandBox(owner)
  return body.health > 0 && hurtboxes(body).some((box) => boxesOverlap(hand, box))
}

/**
 * The right hand rests on the owner's own on-stage kameo. One hand holds one body:
 * while it protects the ally it cannot also absorb the opponent's wound.
 */
export function sweetHomeRightOnAlly(state: FightState, side: FightSide): boolean {
  const owner = state[side]
  const slot = state.kameos?.[side]
  if (!slot || !ALLY_ON_STAGE.has(slot.phase)) return false
  if (!owner.attack || !RIGHT_HAND_MOVES.has(owner.attack.moveId ?? '')) return false
  return sweetHomeHandTouches(owner, slot.fighter)
}

/** The body under the right hand: the protected ally wins over the opponent it might touch. */
export function sweetHomeRightBody(
  state: FightState,
  side: FightSide,
  opponent: FightSide | null,
): FightSide | null {
  return sweetHomeRightOnAlly(state, side) ? null : opponent
}

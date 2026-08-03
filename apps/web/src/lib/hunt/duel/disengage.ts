/**
 * The rupture: dropping the aura, breaking the line of sight, and being back in
 * the corridor rather than in the room.
 *
 * It is a gamble and not an escape key. Zetsu covers nothing — for the seconds
 * it takes, every zone is open — so a hunter holding Gyo watches it happen and
 * has three free targets. Against a hunter who is not looking, or one an
 * entrave still has by the ankle, it works.
 *
 * What comes back to the hunt is the reservoir as the duel left it. Breaking
 * away is not a reset: it is the middle of the same game, with less in hand.
 */
import type { DuelState } from './state'

/** Seconds of unread Zetsu it takes to be gone. */
export const BREAK_AWAY_AFTER = 3

/** Whether the attempt is going unseen this tick. */
export function slippingAway(state: DuelState): boolean {
  return state.player.zetsu && !state.hunter.gyo && state.hunter.ko === null
}

export function tickDisengage(state: DuelState, dt: number): DuelState {
  if (!state.player.zetsu) return state.breaking === 0 ? state : { ...state, breaking: 0 }
  if (!slippingAway(state)) return { ...state, breaking: 0 }

  const breaking = state.breaking + dt
  if (breaking < BREAK_AWAY_AFTER) return { ...state, breaking }
  return { ...state, breaking, outcome: 'broke' }
}

/** Dropping into Zetsu, or picking the aura back up. */
export function setZetsu(state: DuelState, on: boolean): DuelState {
  return {
    ...state,
    player: {
      ...state.player,
      zetsu: on,
      ko: on ? null : state.player.ko,
      ken: on ? false : state.player.ken,
    },
    breaking: on ? state.breaking : 0,
  }
}

/**
 * Taking your own aura back, mid-duel, by touching it.
 *
 * This is what turns "back towards my own traps" into a manoeuvre rather than a
 * figure of speech. An entrave still set in the room is twenty-five points
 * standing on the floor; touching it puts them in the body *now*, where
 * regeneration would take six seconds of standing still the duel does not offer.
 *
 * It is not free either. The entrave that gets picked up is the entrave that
 * does not go off, so recovering is choosing the reservoir over the ambush —
 * exactly the same trade as step 2, asked again with the room on fire.
 */
import { release } from '../aura'
import { recoverAura, type Ledger } from '../nen/placed'
import { entravesInRoom } from './inherit'
import type { DuelState } from './state'

export interface Recovery {
  duel: DuelState
  ledger: Ledger
  /** Ids taken back, for the journal. Empty when there was nothing to take. */
  recovered: string[]
}

/** The one nearest the player, or null when the room holds none. */
export function nearestSet(ledger: Ledger, state: DuelState): string | null {
  const inRoom = entravesInRoom(ledger.placements, state.spaceId)
  return inRoom.length > 0 ? inRoom[0].id : null
}

/**
 * Takes one placement back into the duelling body. The pool moves in the duel
 * state and the ledger both, because they are the same hundred points seen from
 * two sides of the junction.
 */
export function recoverInDuel(ledger: Ledger, state: DuelState): Recovery {
  const id = nearestSet(ledger, state)
  if (!id) return { duel: state, ledger, recovered: [] }

  const taken = recoverAura(ledger, id)
  if (!taken.recovered) return { duel: state, ledger, recovered: [] }

  const player = {
    ...state.player,
    pool: release(state.player.pool, taken.recovered.cost),
    broken: false,
  }

  return { duel: { ...state, player }, ledger: taken.ledger, recovered: [id] }
}

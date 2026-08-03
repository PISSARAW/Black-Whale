/**
 * The junction. This file is the question the whole prototype exists to answer.
 *
 * Two things cross from the hunt into the duel, and nothing else does. The
 * reservoirs are the ones the hunt left — not a fixed hundred each, so ten
 * minutes of sweeping and ten minutes of being made to search are both already
 * on the board before the first tick. And any entrave still set in the room the
 * contact happened in springs on the way in, so the hunter opens the duel held:
 * covering nothing, for six seconds, while the player has a Ko in hand.
 *
 * If four minutes of preparation cannot be felt through those two channels,
 * that is the answer to the step-4 gate, and it is a real answer.
 */
import type { AuraPool } from '../aura'
import { ENTRAVE_HOLD, springEntraves } from '../nen/entrave'
import { liveOf, type Ledger, type Placement } from '../nen/placed'
import { initialDuelState, type DuelState } from './state'

export interface Contact {
  /** The hunter's reservoir as the hunt left it. The player's comes from the ledger. */
  hunterPool: AuraPool
  spaceId: string | null
  /** Seconds an entrave already had him for when the contact happened. */
  hunterHeld?: number
  seed?: number
}

export interface Junction {
  duel: DuelState
  ledger: Ledger
  /** The entraves that fired on the way in, for the journal. */
  sprung: Placement[]
}

/** The entraves still set in the room the contact happened in. */
export function entravesInRoom(
  placements: readonly Placement[],
  spaceId: string | null,
): Placement[] {
  if (!spaceId) return []
  return liveOf(placements).filter((placement) => placement.spaceId === spaceId)
}

export function openDuel(ledger: Ledger, contact: Contact): Junction {
  const waiting = entravesInRoom(ledger.placements, contact.spaceId)
  // Springing first, so the pool the player walks in with is the one the firing
  // left them — the entrave is spent, and the ceiling it was holding down is not.
  const after = springEntraves(ledger, waiting).ledger

  const duel = initialDuelState({
    player: after.pool,
    hunter: contact.hunterPool,
    spaceId: contact.spaceId,
    seed: contact.seed,
  })

  // Two ways he can arrive held: one waiting in the room springs on the way in,
  // or one caught him a moment before the contact and has not run out yet. The
  // second is the more common — a hunter who steps into an entrave keeps walking
  // into the player a second later — and dropping it would have made the whole
  // manoeuvre invisible at exactly the moment it was supposed to pay.
  const heldFor = Math.max(contact.hunterHeld ?? 0, waiting.length > 0 ? ENTRAVE_HOLD : 0)

  return {
    duel: heldFor > 0 ? { ...duel, hunter: { ...duel.hunter, held: heldFor } } : duel,
    ledger: after,
    sprung: waiting,
  }
}

/** Counts the hold down. Held, the hunter covers nothing — see `ryu.coveredZones`. */
export function tickHolds(state: DuelState, dt: number): DuelState {
  if (state.hunter.held <= 0 && state.player.held <= 0) return state
  return {
    ...state,
    player: { ...state.player, held: Math.max(0, state.player.held - dt) },
    hunter: { ...state.hunter, held: Math.max(0, state.hunter.held - dt) },
  }
}

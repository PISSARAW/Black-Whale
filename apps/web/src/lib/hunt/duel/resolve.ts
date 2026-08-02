/**
 * How a duel ends. Two ways, and neither of them counts anything.
 *
 * A gathered Ko lands on a zone the other one is not covering, or a reservoir
 * reaches zero and the Ten stops holding. There is no health, no damage, and
 * nothing here compares one duelist's numbers with the other's — the question
 * asked is always "is that zone covered", and the answer is in a list of zones
 * `ryu.ts` derives from what the defender is doing (I1).
 *
 * Read against invariant I4 — a player never beats an intact hunter — this file
 * is deliberately not where I4 is enforced. Nothing here says "the hunter
 * cannot be hit". An intact hunter survives because he can afford Gyo, so he
 * reads the gathered Ko, and can afford Ken or a guard on that zone, so he
 * answers it. Take his aura away during the hunt and the same code lets the
 * same blow through. That is the junction, and hard-coding I4 would have hidden
 * it behind a rule instead of building it.
 */
import { coveredZones } from './ryu'
import { releaseKo } from './ko'
import type { BodyZone, DuelOutcome, DuelState, DuelistState } from './state'

export type Side = 'player' | 'hunter'

/** Whether a blow to `zone` would land on this duelist. */
export function isExposedAt(duelist: DuelistState, zone: BodyZone): boolean {
  return !coveredZones(duelist).includes(zone)
}

/**
 * Throws the gathered Ko. Nothing happens if none is gathered; if one is, it is
 * spent either way — a Ko that is answered is still a Ko that was thrown.
 */
export function resolveStrike(state: DuelState, attacker: Side): DuelState {
  const striker = state[attacker]
  const zone = striker.ko
  if (!zone) return state

  const defending: Side = attacker === 'player' ? 'hunter' : 'player'
  const landed = isExposedAt(state[defending], zone)

  return {
    ...state,
    [attacker]: releaseKo(striker),
    outcome: landed ? endFor(attacker) : state.outcome,
  }
}

/**
 * The other ending. At zero the Ten no longer holds; there is nothing left to
 * cover with and nothing left to strike with, so the duel is over where it
 * stands. This is what makes winning without ever attacking possible (I3).
 */
export function checkExhaustion(state: DuelState): DuelState {
  const player = markBroken(state.player)
  const hunter = markBroken(state.hunter)
  return {
    ...state,
    player,
    hunter,
    outcome: outcomeOf({ player, hunter, current: state.outcome }),
  }
}

function markBroken(duelist: DuelistState): DuelistState {
  return duelist.pool.available > 0 ? duelist : { ...duelist, broken: true, ko: null, ken: false }
}

function outcomeOf(reading: {
  player: DuelistState
  hunter: DuelistState
  current: DuelOutcome
}): DuelOutcome {
  if (reading.current !== 'playing') return reading.current
  // Both spent at once is the hunter's win: the player is the one being hunted.
  if (reading.player.broken) return 'lost'
  if (reading.hunter.broken) return 'won'
  return 'playing'
}

function endFor(attacker: Side): DuelOutcome {
  return attacker === 'player' ? 'won' : 'lost'
}

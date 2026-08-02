/**
 * The hunter, at arm's length. He distributes, he feints, he commits — and he
 * does not cheat.
 *
 * Everything he knows about the player comes back from `readAura`, the same
 * function the player's own Gyo goes through, and it costs him the same five a
 * second. With In up he is told the reading is hidden and gets nothing; he then
 * strikes anyway, at a guess, because a hunter who waits for certainty is a
 * hunter who has stopped hunting. There is no branch here that consults the
 * player's state directly, which is the point (I5, T3.9).
 *
 * He presses. That is the single most important thing about him, and it is what
 * makes both of the invariants around this file true at once:
 *
 *   I4, against an intact hunter the player always loses — because with aura in
 *   hand he can afford Gyo, so he sees the gathered Ko inside its wind-up, and
 *   can afford Ken, so he answers it. Nothing here says he cannot be hit.
 *
 *   I3, a duel can be won without attacking — because a hunter the hunt has
 *   emptied can no longer afford to look, and a hunter who cannot look spends
 *   his last twenty on a Ko thrown into a Ken he never saw. The player wins by
 *   standing there. Both endings come out of the same code and the same costs;
 *   what decides which one happens is the ten minutes before the contact.
 */
import { GYO_PER_SECOND, readAura, type Reading } from '../duel/gyo'
import { canCharge, chargeKo } from '../duel/ko'
import { raiseKen, KEN_PER_SECOND } from '../duel/ken'
import { setRyu, STRIKE_THRESHOLD } from '../duel/ryu'
import { BODY_ZONES, type BodyZone, type DuelState, type DuelistState } from '../duel/state'
import { chanceIn, pick } from '../random'

/** Average seconds between decisions. He is fast, not instantaneous. */
export const THINKING_TIME = 0.5
/** He keeps this much back for the answer rather than spending to the last point. */
export const HELD_IN_RESERVE = KEN_PER_SECOND * 2
/** How long he will stand off before closing anyway. */
export const PATIENCE = 4

export function playHunter(state: DuelState, dt: number): DuelState {
  if (state.hunter.broken || state.hunter.held > 0) return state

  // He reads with the Gyo he is *already* holding and has already been charged
  // for this tick. Switching it on to look and off again inside one tick would
  // hand him a free reading every frame, which is exactly the kind of quiet
  // cheat T3.9 forbids.
  const reading = readAura(state.hunter, state.player)

  // Answering a gathered Ko is a reflex, not a decision: it is checked every
  // tick, because the wind-up is under a second and a hunter who only noticed
  // it on his next thinking tick would be answering a blow that already landed.
  if (reading.koCharged) return { ...state, hunter: answer(state.hunter, reading.guard) }

  const thinking = chanceIn(state.rng, dt / THINKING_TIME)
  if (!thinking.hit) return { ...state, rng: thinking.rng, hunter: waited(state.hunter, dt) }

  return decide({ ...state, rng: thinking.rng }, dt)
}

function decide(state: DuelState, dt: number): DuelState {
  const reading = readAura(state.hunter, state.player)

  // A Ken he can see is a wall: nothing gets through it, so nothing is thrown
  // at it — for a while. Past his patience he closes anyway, because a hunter
  // who will stand in a doorway indefinitely is not hunting, and because a
  // standoff neither side can be made to leave is not a duel.
  if (reading.ken && state.hunter.waiting < PATIENCE) return settle(state, dt)

  // Nothing to answer: held, spent, or standing there in Zetsu. He commits.
  if (isOpen(state.player)) return commit(state, null)

  // Otherwise he presses regardless, avoiding the guard if he has read one and
  // guessing if In has taken it away from him.
  return commit(state, reading.guard)
}

/** Time passing without a decision still counts against his patience. */
function waited(hunter: DuelistState, dt: number): DuelistState {
  return { ...hunter, waiting: hunter.waiting + dt }
}

/**
 * Whoever cannot cover anything is open, whatever the reason — and all three
 * reasons are visible across a room without Gyo. A body held by an entrave is
 * not going anywhere, and one whose Ten has stopped holding does not look like
 * one whose Ten holds.
 */
function isOpen(duelist: DuelistState): boolean {
  return duelist.broken || duelist.zetsu || duelist.held > 0
}

/**
 * Whether to keep Gyo up for the next tick. Comfortably affordable means enough
 * for it *and* for the Ken that answers what it finds — looking with nothing
 * left to answer with is the most expensive way there is to lose.
 */
function look(hunter: DuelistState): DuelistState {
  return { ...hunter, gyo: hunter.pool.available > GYO_PER_SECOND + HELD_IN_RESERVE }
}

/**
 * Answering a Ko he can see. Ken if he can pay for it — it covers everywhere,
 * so the read does not even have to be right; otherwise he settles back onto
 * the zone he read, which covers it and its neighbour, and hopes.
 */
function answer(hunter: DuelistState, zone: BodyZone | null): DuelistState {
  if (hunter.pool.available > KEN_PER_SECOND * 2) return raiseKen(hunter, true)
  return setRyu(raiseKen(hunter, false), { attack: 0.2, guard: zone ?? hunter.guard })
}

/** Sitting back: two zones covered, nothing spent, waiting the other one out. */
function settle(state: DuelState, dt: number): DuelState {
  const hunter = setRyu(raiseKen(state.hunter, false), { attack: 0.2 })
  return { ...state, hunter: waited({ ...hunter, gyo: false }, dt) }
}

/**
 * Pushing forward and gathering into a zone the other one is not on. With a
 * guard read he strikes anywhere but there; with nothing read he guesses, and
 * forcing that guess is the whole of what the player's In was bought for.
 *
 * With nothing left to gather with, he can only cover — which is the shape a
 * hunter the hunt has emptied dies in.
 */
function commit(state: DuelState, avoid: BodyZone | null): DuelState {
  const pushed = look(setRyu(raiseKen(state.hunter, false), { attack: STRIKE_THRESHOLD + 0.2 }))
  if (!canCharge(pushed)) return { ...state, hunter: { ...pushed, waiting: 0 } }

  const open = avoid ? BODY_ZONES.filter((zone) => zone !== avoid) : BODY_ZONES
  const chosen = pick(state.rng, open)
  return {
    ...state,
    rng: chosen.rng,
    hunter: { ...chargeKo(pushed, chosen.item ?? 'torso'), waiting: 0 },
  }
}

export type { Reading }

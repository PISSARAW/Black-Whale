/**
 * The entrave: the prototype's one and only trap.
 *
 * Twenty-five of the hundred, laid on the floor, and it does exactly one thing
 * — it holds the hunter where he stands for a few seconds. It does not wound
 * him, it does not alarm, it does not lie to him. Those are all good traps and
 * all of them belong to a later version; one type is enough to ask whether
 * something placed four minutes ago is felt at the moment of contact, and every
 * second type makes that question harder to read rather than easier.
 *
 * A hunter who has spotted an entrave walks around it. That is what makes
 * `hunter/inspect.ts` worth having and what stops "lay one in every doorway"
 * from being the whole game.
 */
import type { Vec2 } from '../../tour/types'
import { consumeAura, liveOf, type Ledger, type Placement } from './placed'

export const ENTRAVE_COST = 25
/** Seconds the hunter is held. Long enough to cross a room, not to leave the deck. */
export const ENTRAVE_HOLD = 6
/** How close he has to come. About an arm's length either side of a stride. */
export const ENTRAVE_REACH = 1.4

export interface Walker {
  position: Vec2
  spaceId: string | null
}

/**
 * Which laid entraves the walker has just stepped into. Ones he has already
 * spotted are stepped over: seeing a trap is what avoiding it is made of.
 */
export function entravesUnderfoot(placements: readonly Placement[], walker: Walker): Placement[] {
  if (!walker.spaceId) return []
  return liveOf(placements).filter((placement) => {
    if (placement.seen || placement.spaceId !== walker.spaceId) return false
    const dx = placement.position[0] - walker.position[0]
    const dz = placement.position[1] - walker.position[1]
    return Math.hypot(dx, dz) <= ENTRAVE_REACH
  })
}

/**
 * Springs the entraves the walker stepped into: the ledger loses their aura and
 * the caller is told how long the hunter is held. Two at once do not stack into
 * twelve seconds — being held is a state, not a quantity (invariant I1).
 */
export function springEntraves(ledger: Ledger, sprung: readonly Placement[]): { ledger: Ledger; hold: number } {
  if (sprung.length === 0) return { ledger, hold: 0 }
  return { ledger: consumeAura(ledger, sprung.map((placement) => placement.id)), hold: ENTRAVE_HOLD }
}

/** Counts a hold down. Held is binary; this is only how long it has left to run. */
export function tickHold(held: number, dt: number): number {
  return Math.max(0, held - dt)
}

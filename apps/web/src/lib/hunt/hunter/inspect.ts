/**
 * The hunter's Gyo, on this side of the contact: looking hard at a floor.
 *
 * He does not see every entrave, and he does not see any of them for free. He
 * inspects when he has a reason to — he is searching a room he believes someone
 * is in — and it costs him five each time, which is a quarter of a sweep and
 * which comes out of the same hundred that has to last him ten minutes. Every
 * inspection the player provokes is aura the hunter will not have at the moment
 * of contact, and that is the whole mechanism behind T4.4.
 *
 * What he finds is a die roll against distance: an entrave at his feet is hard
 * to miss, one across the room is easy to. Traps he has already spotted stay
 * spotted, and he walks around those.
 */
import { canAfford, spend, type AuraPool } from '../aura'
import { liveOf, type Placement } from '../nen/placed'
import { chanceIn, type Rng } from '../random'
import type { Vec2 } from '../../tour/types'

export const INSPECT_COST = 5
/** How long he spends looking before he can look again. */
export const INSPECT_INTERVAL = 5
/** Beyond this he is not looking at it, he is standing in the same room as it. */
export const INSPECT_RANGE = 6

export interface Inspection {
  pool: AuraPool
  rng: Rng
  found: string[]
}

export interface Inspector {
  position: Vec2
  spaceId: string | null
  pool: AuraPool
  rng: Rng
}

/**
 * Odds of spotting one placement. Near-certain underfoot, near-hopeless at the
 * far wall — a straight falloff, because anything cleverer would be a number
 * nobody can feel while playing.
 */
export function oddsOfSpotting(from: Vec2, placement: Placement): number {
  const gap = Math.hypot(placement.position[0] - from[0], placement.position[1] - from[1])
  if (gap > INSPECT_RANGE) return 0
  return 0.9 * (1 - gap / INSPECT_RANGE)
}

/**
 * One inspection of the room the inspector is standing in. Returns his pool and
 * generator advanced, and the ids he spotted — the caller marks them, because
 * the placements belong to the player's ledger and not to the hunter.
 */
export function inspectRoom(inspector: Inspector, placements: readonly Placement[]): Inspection {
  const { pool, rng, position, spaceId } = inspector
  if (!spaceId || !canAfford(pool, INSPECT_COST)) return { pool, rng, found: [] }

  const candidates = liveOf(placements).filter(
    (placement) => !placement.seen && placement.spaceId === spaceId,
  )
  if (candidates.length === 0) return { pool, rng, found: [] }

  let roll = rng
  const found: string[] = []
  for (const placement of candidates) {
    const drawn = chanceIn(roll, oddsOfSpotting(position, placement))
    roll = drawn.rng
    if (drawn.hit) found.push(placement.id)
  }

  return { pool: spend(pool, INSPECT_COST), rng: roll, found }
}

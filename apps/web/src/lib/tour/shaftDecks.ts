import type { TierPlan } from '$lib/tour/blueprint'
import { shaftAnchors, type ShaftAnchor } from '$lib/tour/godRays'
import { visibleSpaces } from '$lib/tour/visibility'

/** Re-exported so the scene reaches the shafts through one door. */
export { shaftStrength } from '$lib/tour/godRays'

export interface ShaftWindow {
  anchor: ShaftAnchor
  /**
   * Depth one: the room the window is in, and the rooms that open onto it. Two
   * would put a shaft in a corridor with a room between it and any glass, which
   * is the decorative version this refuses to be.
   */
  rooms: Set<string>
}

/**
 * The windows a deck has, worked out once per deck and kept.
 *
 * Two rooms on the ship have one — see `$lib/tour/godRays` — so this is a
 * `uStrength` of zero on 312 of the 314, which the pass answers with a single
 * branch. The gate is the room and its neighbours rather than the projection
 * alone: a window across a hundred metres of Tier 3, behind four bulkheads, is
 * off screen to the eye and still on screen to the projection matrix, and
 * marching twenty-four taps a pixel towards it would buy nothing at all.
 *
 * The cache is a plain `Map` and lives out here on purpose: nothing renders off
 * it, it is read inside the aim that runs every frame, and a deck's windows do
 * not move.
 */
export function createShaftDecks(): (plan: TierPlan) => ShaftWindow[] {
  const decks = new Map<string, ShaftWindow[]>()
  return (plan) => {
    let windows = decks.get(plan.tier.id)
    if (!windows) {
      windows = shaftAnchors(plan).map((anchor) => ({
        anchor,
        rooms: visibleSpaces(plan, anchor.spaceId, 1),
      }))
      decks.set(plan.tier.id, windows)
    }
    return windows
  }
}

/**
 * Bungee Gum's own arithmetic: what a strand is, and what pulling on it does.
 *
 * The walk has carried Bungee Gum since the solids arrived, and it carried one
 * gesture: stick a strand between two things and let go. The ability is a dozen
 * gestures, and every one of them is the same two properties — it is elastic,
 * and it is adhesive — pointed at a different thing. So the rules go here,
 * once, in a leaf module with no ship in it, and `hatsu.ts` decides nothing
 * about gum beyond which of these answers it applies.
 *
 * The one number that is canon rather than staging: **the force rises with the
 * stretch.** `abilities.json` says it in the ability's own description and the
 * module says it in its `site.rule` — "elastic force rises with tension". So
 * nothing here is a constant pull: what a strand does when it contracts is a
 * function of how far it was drawn out first, and that function is the whole
 * module. A gauge that did not move as the visitor backed away from the thing
 * they had stuck would be drawing an elastic and simulating a rope.
 *
 * Pure, and free of three.js, the ship and the world: it is handed metres and
 * points, and it hands back metres and points.
 */
import type { Vec2 } from './types'

/**
 * A filament, out of the wrist and stuck to something.
 *
 * `rest` is the whole reason this is a record rather than an id: a strand
 * remembers how long it was when it stuck, because everything the ability does
 * afterwards is measured against that length. Stick to the cabinet from two
 * metres and back off to nine, and the gum has seven metres of stretch in it.
 */
export interface GumStrand {
  /** The solid the filament is stuck to. */
  solidId: string
  /** The metres between the wrist and the anchor at the moment it stuck. */
  rest: number
}

/**
 * The stretch at which the gauge reads full, in metres.
 *
 * Ten because that is the one distance the canon puts on this aura: a filament
 * separated from its body breaks past ten metres. A strand still joined to the
 * wrist does not break — nothing here snaps one — but the number the archive
 * gives for how far this gum reaches before it is at its limit is ten, and
 * inventing a second number when the catalogue already holds one would be the
 * walk making up a fact about the technique to fill a gauge.
 */
export const GUM_TAUT_METRES = 10

/** How far a strand has been drawn beyond the length it stuck at, in metres. */
export function gumStretch(strand: GumStrand, metres: number): number {
  return Math.max(0, metres - strand.rest)
}

/**
 * What the strand is holding, from nothing to as much as this aura carries.
 *
 * Between 0 and 1 so that every surface reads the same number: the panel draws
 * it as a gauge, the contraction reads it as a speed, and neither of them has
 * to know what a metre of gum is worth.
 */
export function gumTension(strand: GumStrand, metres: number): number {
  return Math.min(1, gumStretch(strand, metres) / GUM_TAUT_METRES)
}

/** Everything the contraction looks at. Nothing is fetched, nothing is global. */
export interface GumPull {
  /** Where the visitor stands, which is where the wrist is. */
  at: Vec2
  /** Where the anchor stands now, after anything already done to it. */
  anchorAt: Vec2
  /**
   * Half the diagonal of the thing being pulled, plus the room a body takes:
   * how close to the visitor it can come to rest without standing in them.
   */
  clearance: number
}

/**
 * Where a thing comes to rest when the gum brings it in.
 *
 * On the line it was pulled along and just short of the visitor, because that
 * is what a contraction does: the strand shortens, and the shorter it gets the
 * closer the two ends are. It is never *at* the visitor — a wardrobe that
 * finished its trip inside the person who pulled it would be the walk drawing
 * a collision it has no way to resolve.
 */
export function gumLanding(pull: GumPull): Vec2 {
  const dx = pull.anchorAt[0] - pull.at[0]
  const dz = pull.anchorAt[1] - pull.at[1]
  const length = Math.hypot(dx, dz) || 1
  const gap = Math.min(pull.clearance, length)
  return [pull.at[0] + (dx / length) * gap, pull.at[1] + (dz / length) * gap]
}

/** What a cast of Bungee Gum at a solid comes to. */
export type GumAct =
  /** Nothing was stuck: the filament goes out and takes hold. */
  | { act: 'stick'; rest: number }
  /** The same anchor, cast at again: the strand contracts and brings it in. */
  | { act: 'reel'; landing: Vec2; metres: number }
  /** The same anchor, but a bulkhead between: the strand goes taut and holds. */
  | { act: 'taut'; metres: number }
  /** A second thing, with the first still stuck: the two are joined instead. */
  | { act: 'pair' }

/** Everything the decision reads. */
export interface GumAim extends GumPull {
  /** The strand already out, or null when the wrist is empty. */
  strand: GumStrand | null
  /** The solid down the reticle. */
  solidId: string
  /** Whether the visitor and the anchor are in the same room. */
  together: boolean
}

/**
 * What happens when the gum is cast at the thing down the reticle.
 *
 * Three of the four answers are the one ability being pointed at three things,
 * and the fourth is the refusal that keeps the walk honest: a room the visitor
 * is not standing in has a bulkhead in the way, and a cabinet dragged through
 * a bulkhead would be a claim about the ship rather than about the gum. The
 * strand still goes taut, because it is still attached — that is the point of
 * saying so instead of doing nothing.
 */
export function aimGum(aim: GumAim): GumAct {
  const metres = Math.hypot(aim.anchorAt[0] - aim.at[0], aim.anchorAt[1] - aim.at[1])
  if (!aim.strand) return { act: 'stick', rest: metres }
  if (aim.strand.solidId !== aim.solidId) return { act: 'pair' }
  if (!aim.together) return { act: 'taut', metres }
  const landing = gumLanding(aim)
  return {
    act: 'reel',
    landing,
    metres: Math.hypot(aim.anchorAt[0] - landing[0], aim.anchorAt[1] - landing[1]),
  }
}

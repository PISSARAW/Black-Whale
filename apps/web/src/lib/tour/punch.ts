/**
 * Remote Punch's one rule: the blow travels through matter, never through air.
 *
 * The walk carried this ability as a flash and a noise. The fist came up under
 * whatever was down the reticle, out of nothing in particular, and it came up
 * just as readily across an open well as along a deck — which is the one thing
 * ch. 385 is unambiguous about that the walk was getting wrong. Leorio hits a
 * surface. The aura runs *in* that surface. It comes out where he chose. Every
 * one of those three words is load-bearing, and the middle one is the ability:
 * a strike that could cross a void would be a projectile, and this is not one.
 *
 * So the question this module answers is the geometric one — **is there
 * continuous matter between here and there** — and it answers it the way the
 * walk already answers "can you walk there": by stepping along the line and
 * asking, at each step, whether anything is under it. Nothing invented, and the
 * same test the thread and the footing use, which is what keeps a blow that
 * crosses a bulkhead and a blow that crosses a well telling the truth about the
 * ship rather than about this file.
 *
 * A bulkhead conducts. That is not a concession, it is the point: the fist in
 * ch. 385 comes out of the leaf of a closed door, and a model in which steel
 * stopped the aura would refuse the very panel the ability is drawn in. What
 * stops it is the absence of anything at all.
 *
 * Pure, and free of three.js, the ship and the world: it is handed a predicate
 * and two points, and it hands back the line the aura took, or nothing.
 */
import type { Vec2 } from './types'

/**
 * How finely the line is walked, in metres.
 *
 * Half a metre because that is the narrowest thing the walk lets a visitor fall
 * down: any gap wider than a footfall is a gap the aura has to cross, and any
 * gap narrower than one is a seam in the deck. A coarser step would let the
 * blow hop a well; a finer one would only cost frames to say the same thing.
 */
export const PUNCH_STEP = 0.5

/** Everything the line looks at. Nothing is fetched, nothing is global. */
export interface PunchAim {
  /** Where the fist goes in: the visitor's own feet. */
  from: Vec2
  /** Where it is to come out: whatever they chose. */
  to: Vec2
  /** Whether there is anything under this point to run through. */
  onFloor: (at: Vec2) => boolean
}

/**
 * The line the aura takes through the matter, or `null` where there is none.
 *
 * The returned points are what Gyo shows — the emitted aura running in the
 * surface from the impact to the exit — so they are handed back rather than
 * merely counted: a technique whose whole visible substance is a line has to
 * give the line to whatever is drawing it.
 *
 * Both ends are included, and both are checked. A visitor standing on nothing
 * has nothing to strike, and an exit over nothing has nothing to come out of.
 */
export function punchRuns(aim: PunchAim): Vec2[] | null {
  const dx = aim.to[0] - aim.from[0]
  const dz = aim.to[1] - aim.from[1]
  const metres = Math.hypot(dx, dz)
  const steps = Math.max(1, Math.ceil(metres / PUNCH_STEP))
  const through: Vec2[] = []
  for (let step = 0; step <= steps; step++) {
    const along = step / steps
    const at: Vec2 = [aim.from[0] + dx * along, aim.from[1] + dz * along]
    if (!aim.onFloor(at)) return null
    through.push(at)
  }
  return through
}

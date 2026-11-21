import { maryStruckAt } from './bloodyMaryCapture'
import type { MaryDrop } from './bloodyMary'
import type { FightSide, FightState } from './types'

/**
 * Bloody Mary's drops are real blood taken from the reserve. A first blow only
 * disperses a drop; striking it again while it is still dispersed destroys it,
 * and that blood never comes back. Moving matter near a patrolling drop draws
 * its attention away from Zakuro's target. Ranges are duel tuning.
 */
export const MARY_LURE_RANGE = 12
export const MARY_DISPERSAL_FRAMES = 30
/** The blow that dispersed a drop stays active a few frames; it cannot count twice. */
const SAME_BLOW_FRAMES = 12

/** A dispersed drop is blind and still; a second blow scatters it for good. */
export function stepDispersedDrop(
  state: FightState,
  side: FightSide,
  drop: MaryDrop & { remainingFrames: number },
): MaryDrop {
  const fresh = drop.reformFrames > MARY_DISPERSAL_FRAMES - SAME_BLOW_FRAMES
  if (!fresh && maryStruckAt(state, side, drop)) return { ...drop, remainingFrames: 0 }
  return { ...drop, reformFrames: drop.reformFrames - 1 }
}

/** A thrown or fired object passing nearby pulls a ground patrol towards it. */
export function lureMaryDrop(state: FightState, side: FightSide, drop: MaryDrop): MaryDrop {
  if (drop.wallId || drop.y > 1 || state[side].bloodyMary?.returning) return drop
  const lure = state.projectiles
    .filter((shot) => shot.owner !== side && Math.abs(shot.x - drop.x) <= MARY_LURE_RANGE)
    .sort((a, b) => Math.abs(a.x - drop.x) - Math.abs(b.x - drop.x))[0]
  if (!lure || lure.x === drop.x) return drop
  return { ...drop, direction: lure.x > drop.x ? 1 : -1 }
}

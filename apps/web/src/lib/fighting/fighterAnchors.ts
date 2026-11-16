import { machiImmobilized } from './machiThread'
import type { ArcadeFighter } from './types'

export function fighterAnchored(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.chainJail) || machiImmobilized(fighter)
}

/** Bound bodies cannot be displaced by the other fighter walking into their pushbox. */
export function anchorFighter(fighter: ArcadeFighter): ArcadeFighter {
  const thread = machiImmobilized(fighter) ? fighter.machiThread : undefined
  const anchor = fighter.chainJail ?? thread
  return anchor ? { ...fighter, x: anchor.x, y: anchor.y, velocityY: 0 } : fighter
}

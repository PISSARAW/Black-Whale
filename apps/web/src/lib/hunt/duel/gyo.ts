/**
 * Gyo: five a second to see where the other one's aura is.
 *
 * It reads the guard and whether a Ko is gathered, which is exactly the
 * information needed to answer either. It is also the only reason In is worth
 * paying for — a duel where nobody looks is a duel where nobody can be fooled.
 *
 * The reading is returned as data rather than drawn, so the hunter's AI reads
 * the player through this same function and gets exactly what the player gets
 * (T3.9): it does not cheat, it pays five a second like anyone else.
 */
import { spend } from './costs'
import type { BodyZone, DuelistState } from './state'

export const GYO_PER_SECOND = 5

export interface Reading {
  /** Which zone the aura is gathered on. This is what Gyo buys, and In sells. */
  guard: BodyZone | null
  /**
   * That a Ko is being gathered. Not what Gyo is for: aura pulling into a point
   * an arm's length away is felt rather than read, so this is true whoever is
   * looking and whatever In is doing. Gyo tells you *where* it is going, which
   * is a different and cheaper question than whether something is coming.
   */
  koCharged: boolean
  /**
   * Ken is aura spread over a whole body. There is no concentration to hide, so
   * In does not conceal it and a looker sees it for what it is — which is what
   * stops either side from spending Ko after Ko into a wall.
   */
  ken: boolean
  /** True when In hides the target from an observer who is not using Gyo. */
  hidden: boolean
}

/** Charges Gyo for a tick. Running out drops it rather than going negative. */
export function payForGyo(duelist: DuelistState, dt: number): DuelistState {
  return spend(duelist, { active: duelist.gyo, rate: GYO_PER_SECOND, dt, drop: 'gyo' })
}

/**
 * What a looker learns about a target. The gathered blow and the raised Ken are
 * plain to anyone standing there; the zone is what has to be paid for, and what
 * In takes back.
 */
export function readAura(looker: DuelistState, target: DuelistState): Reading {
  const plain = { guard: null, koCharged: target.ko !== null, ken: target.ken }
  if (!looker.gyo) return { ...plain, hidden: target.in }
  return { ...plain, guard: target.guard, hidden: false }
}

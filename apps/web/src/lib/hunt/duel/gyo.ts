/**
 * Gyo: five a second to see where the other one's aura is, even under In.
 *
 * An unhidden guard is plain to the naked eye; In hides it, and Gyo is what
 * reads it anyway. The two are a pair: In is worth paying for only against a
 * looker without Gyo, and Gyo only against a target holding In.
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
   * That a Ko is being gathered. It is plain unless In conceals the gathering;
   * Gyo restores both the warning and the zone in that case.
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
 * What a looker learns about a target. In takes the concentration and its tell
 * away together; Gyo gives both back.
 */
export function readAura(looker: DuelistState, target: DuelistState): Reading {
  const plain = { ken: target.ken }
  // An aura nobody is hiding shows where it sits to anyone standing there. In
  // takes that away from the naked eye; Gyo gives it back. Without the first
  // branch In hid a guard nothing could see anyway, and cost five a second for
  // nothing.
  if (!looker.gyo && target.in) return { ...plain, guard: null, koCharged: false, hidden: true }
  return { ...plain, guard: target.guard, koCharged: target.ko !== null, hidden: false }
}

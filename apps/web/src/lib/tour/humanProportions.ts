import type { FrameShape } from './humanProfiles'

/**
 * The canon — how many heads tall a body aboard is, and where its joints sit.
 *
 * The walk used to draw an adult about four and a half heads tall, with the
 * hips at two fifths of the height and the hands stopping at the belt. That is
 * the canon of a figurine. The succession arc is drawn close to seven heads,
 * legs for half the body and fingertips at mid-thigh, and no amount of ink or
 * hair makes a four-and-a-half-head body read as one of its panels.
 *
 * The trunk keeps its coordinates: the hips stay at 0,77 and the shoulders at
 * 1,34, because every costume, every signature and every pose is written
 * against those two numbers. What moves is everything hung from them — the
 * head shrinks about the chin, the legs grow *downwards* past the old origin,
 * the arms grow to the thigh — and `stance` gives back the lift that puts the
 * soles on the floor again.
 */
export const CANON = {
  /** Multiplier on the head group; hair, mask and signatures ride along. */
  headScale: 0.7,
  /** Centre of the skull, high enough that a neck shows over the collar. */
  headY: 1.7,
  hipY: 0.77,
  hipX: 0.11,
  shoulderY: 1.34,
  /** Hip to knee. */
  thigh: 0.44,
  /** Knee to the sole of the shoe. */
  shin: 0.51,
  /** Shoulder to elbow. */
  upperArm: 0.32,
  /** Elbow to the middle of the hand. */
  forearm: 0.3,
} as const

/** The skull's half-height at scale one, and where it used to be centred. */
const SKULL = 0.2128
const FORMER_HEAD_Y = 1.72

export interface Stance {
  /** How far the figure is raised so that longer legs still end at the floor. */
  lift: number
  /**
   * Multiplier on the whole body that keeps its height in the world.
   *
   * A longer-legged adult would otherwise stand taller than the doors were
   * drawn for; a profile's `height` was tuned against the former body and has
   * to go on meaning the same number of centimetres.
   */
  stature: number
}

export function stance(frame: FrameShape): Stance {
  const lift = (CANON.thigh + CANON.shin) * frame.limb - CANON.hipY * frame.neck
  const former = FORMER_HEAD_Y * frame.neck + SKULL * frame.head
  const crown = CANON.headY * frame.neck + SKULL * CANON.headScale * frame.head + lift
  return { lift, stature: former / crown }
}

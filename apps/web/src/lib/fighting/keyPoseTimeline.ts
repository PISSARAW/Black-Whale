import { lerpPose, NEUTRAL_POSE, type FightPose } from './fightPose'
import type { AttackPhase } from './types'

/**
 * A move drawn as key poses pinned to its frame data.
 *
 * The old gestures ran one smooth curve over the whole move, so the arm was
 * still travelling when the hitbox came out and peaked during recovery. A key
 * here names the phase it belongs to — `startup`, `active`, `recovery` — and
 * where in that phase it falls, so the contact pose lands on the first active
 * frame of *this* move, however its tuning stretches it.
 *
 * The rhythm is the one 2D fighters are animated in:
 * - anticipation eases in during startup;
 * - the strike snaps into contact in a frame or two;
 * - contact holds through the active frames (and through hitstop, since the
 *   move's frame counter stops while the game is frozen);
 * - recovery settles back slowly.
 * Outside the active frames poses are held on twos, like hand-keyed animation,
 * instead of being interpolated on every frame.
 */
export type KeyEase = 'snap' | 'in' | 'out' | 'smooth'

export interface KeyPose {
  phase: AttackPhase
  /** 0 is the phase's first frame, 1 its end. */
  at: number
  pose: FightPose
  /** How the body travels from the previous key to this one. */
  ease?: KeyEase
}

export type MoveTimeline = readonly KeyPose[]

export interface PhaseFrames {
  startup: number
  active: number
  recovery: number
}

const EASES: Record<KeyEase, (t: number) => number> = {
  snap: (t) => 1 - (1 - t) ** 5,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  smooth: (t) => t * t * (3 - 2 * t),
}

/** Every move ends back in its stance. */
const SETTLE: KeyPose = { phase: 'recovery', at: 1, pose: NEUTRAL_POSE, ease: 'smooth' }

export function keyFrameOf(key: KeyPose, frames: PhaseFrames): number {
  const starts: Record<AttackPhase, number> = {
    startup: 0,
    active: frames.startup,
    recovery: frames.startup + frames.active,
  }
  return starts[key.phase] + key.at * frames[key.phase]
}

/** Active frames are drawn one by one; the rest are held on twos. */
export function heldFrame(frame: number, frames: PhaseFrames): number {
  const active = frame >= frames.startup && frame < frames.startup + frames.active
  return active ? frame : frame - (frame % 2)
}

export interface TimelineSample {
  frame: number
  frames: PhaseFrames
}

export function sampleTimeline(timeline: MoveTimeline, sample: TimelineSample): FightPose {
  const frame = heldFrame(sample.frame, sample.frames)
  let previous = { frame: 0, pose: NEUTRAL_POSE }
  for (const key of [...timeline, SETTLE]) {
    const at = keyFrameOf(key, sample.frames)
    if (frame < at) {
      const travel = (frame - previous.frame) / Math.max(1e-6, at - previous.frame)
      return lerpPose(previous.pose, key.pose, EASES[key.ease ?? 'smooth'](travel))
    }
    previous = { frame: at, pose: key.pose }
  }
  return previous.pose
}

import { FIGHT_JOINTS, NEUTRAL_POSE, type FightJoint, type FightPose, type Turn } from './fightPose'
import { interpolateJointTurn } from './fightPoseSlerp'
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
  /** Optional destination curves let the kinetic chain arrive joint by joint. */
  jointEase?: Partial<Record<FightJoint, KeyEase>>
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
  /** Ease back into the stance after the last key (the default); off for a body left lying. */
  settle?: boolean
  /** Sample every frame for continuous support gestures. */
  continuous?: boolean
}

export function sampleTimeline(timeline: MoveTimeline, sample: TimelineSample): FightPose {
  const frame = sample.continuous ? sample.frame : heldFrame(sample.frame, sample.frames)
  let previous = { frame: 0, pose: NEUTRAL_POSE }
  for (const key of sample.settle === false ? timeline : [...timeline, SETTLE]) {
    const at = keyFrameOf(key, sample.frames)
    if (frame < at) {
      const travel = (frame - previous.frame) / Math.max(1e-6, at - previous.frame)
      return interpolateKeyPose(previous.pose, key, travel)
    }
    previous = { frame: at, pose: key.pose }
  }
  return previous.pose
}

const ZERO: Turn = [0, 0, 0]

function jointEase(key: KeyPose, joint: (typeof FIGHT_JOINTS)[number]) {
  return EASES[key.jointEase?.[joint] ?? key.ease ?? 'smooth']
}

function interpolateKeyPose(from: FightPose, key: KeyPose, travel: number): FightPose {
  if (travel <= 0) return from
  if (travel >= 1) return key.pose
  const pose: FightPose = {}
  for (const joint of FIGHT_JOINTS) {
    const start = from[joint]
    const end = key.pose[joint]
    if (!start && !end) continue
    const a = start ?? ZERO
    const b = end ?? ZERO
    if (sameTurn(a, b)) {
      pose[joint] = b
      continue
    }
    pose[joint] = interpolateJointTurn(joint, { from: a, to: b }, jointEase(key, joint)(travel))
  }
  return pose
}

function sameTurn(a: Turn, b: Turn): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

import { fightFamily, type FightFamily } from './fightArchetypes'
import { fighterMotionProfile } from './fighterMotionProfile'
import { lerpPose, NEUTRAL_POSE, scalePose, type FightPose } from './fightPose'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, AttackKind } from './types'

/**
 * A subtle whole-body layer beneath authored move poses. It gives every strike
 * a kinetic chain: load the support leg, drive through the hips at contact,
 * carry momentum just past the hit, then recover the guard.
 */

const WINDUP: Record<FightFamily, FightPose> = {
  striker: {
    root: [0, -0.015, -0.025],
    body: [-0.07, 0, 0],
    chest: [-0.02, 0.13, 0],
    rearHip: [-0.08, 0, 0],
    rearKnee: [0.16, 0, 0],
  },
  kicker: {
    root: [0, -0.02, -0.02],
    body: [-0.09, 0, 0],
    chest: [-0.04, 0.08, 0],
    leadHip: [-0.08, 0, 0],
    rearKnee: [0.18, 0, 0],
  },
  blade: {
    root: [0, -0.015, -0.03],
    body: [-0.08, 0, 0],
    chest: [0.02, 0.18, 0],
    rearHip: [-0.06, 0, 0],
    rearKnee: [0.14, 0, 0],
  },
  caster: {
    root: [0, -0.01, -0.02],
    body: [-0.04, 0, 0],
    chest: [-0.03, 0.1, 0],
    leadKnee: [0.08, 0, 0],
    rearKnee: [0.08, 0, 0],
  },
  brute: {
    root: [0, -0.045, -0.035],
    body: [-0.14, 0, 0],
    chest: [-0.06, 0.1, 0],
    leadHip: [-0.1, 0, 0],
    leadKnee: [0.24, 0, 0],
    rearHip: [-0.12, 0, 0],
    rearKnee: [0.28, 0, 0],
  },
}

const DRIVE: Record<FightFamily, FightPose> = {
  striker: {
    root: [0, 0.015, 0.045],
    body: [0.1, 0, 0],
    chest: [0.04, -0.14, 0],
    rearHip: [0.1, 0, 0],
    rearKnee: [0.08, 0, 0],
  },
  kicker: {
    root: [0, 0.025, 0.04],
    body: [-0.06, 0, 0],
    chest: [-0.05, -0.12, 0],
    rearHip: [0.14, 0, 0],
    rearKnee: [-0.06, 0, 0],
  },
  blade: {
    root: [0, 0.01, 0.05],
    body: [0.11, 0, 0],
    chest: [0.04, -0.2, 0],
    rearHip: [0.08, 0, 0],
  },
  caster: {
    root: [0, 0.005, 0.035],
    body: [0.06, 0, 0],
    chest: [0.02, -0.1, 0],
    leadKnee: [-0.05, 0, 0],
    rearKnee: [-0.05, 0, 0],
  },
  brute: {
    root: [0, 0.015, 0.075],
    body: [0.2, 0, 0],
    chest: [0.08, -0.18, 0],
    leadHip: [0.08, 0, 0],
    rearHip: [0.15, 0, 0],
    rearKnee: [0.1, 0, 0],
  },
}

const FOLLOW: Record<FightFamily, FightPose> = {
  striker: { root: [0, 0, 0.025], body: [0.05, 0, 0], chest: [0, -0.08, 0] },
  kicker: { root: [0, -0.01, 0.02], body: [-0.08, 0, 0], chest: [-0.04, -0.06, 0] },
  blade: { root: [0, 0, 0.025], body: [0.06, 0, 0], chest: [0, -0.12, 0] },
  caster: { root: [0, 0, 0.015], body: [0.025, 0, 0], chest: [0, -0.05, 0] },
  brute: { root: [0, -0.02, 0.04], body: [0.12, 0, 0], chest: [0.05, -0.1, 0] },
}

const KIND_WEIGHT: Record<AttackKind, number> = {
  light: 0.45,
  heavy: 0.9,
  special: 1,
  ranged: 0.55,
}

export interface AttackMotionOptions {
  fighter: ArcadeFighter
  frames: AttackFrameData
  /** Hand-authored moves already contain much of this motion. */
  authored: boolean
}

export function attackMotionAccent(options: AttackMotionOptions): FightPose {
  const { fighter, frames, authored } = options
  const attack = fighter.attack
  if (!attack || attack.variant === 'air' || attack.variant === 'throw') return NEUTRAL_POSE
  const family = fightFamily(fighter.id)
  const profile = fighterMotionProfile(fighter.id)
  const strength = KIND_WEIGHT[attack.kind] * profile.attack * (authored ? 0.4 : 1)
  if (attack.frame < frames.startup)
    return scalePose(WINDUP[family], strength * easeIn(attack.frame / frames.startup))
  if (attack.frame < frames.startup + frames.active) return scalePose(DRIVE[family], strength)
  const recovery = (attack.frame - frames.startup - frames.active) / frames.recovery
  return scalePose(lerpPose(FOLLOW[family], NEUTRAL_POSE, easeOut(recovery)), strength)
}

function easeIn(value: number): number {
  return value * value * value
}

function easeOut(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  return 1 - (1 - clamped) ** 3
}

import { fightFamily, type FightFamily } from './fightArchetypes'
import { addPoses, lerpPose, scalePose, type FightPose } from './fightPose'
import { motionOf } from './fighterMovement'
import type { ArcadeFighter } from './types'

/**
 * Authored locomotion poses for the short, explosive movements that should not
 * reuse the continuous walk cycle. A dash has three readable beats: push,
 * travel and catch. The backdash keeps the guard between the fighter and the
 * opponent while the hips retreat.
 */

const FORWARD_PUSH: FightPose = {
  root: [0, -0.08, -0.04],
  body: [0.22, 0, 0],
  chest: [0.08, -0.12, 0],
  leadHip: [-0.45, 0, 0],
  leadKnee: [0.72, 0, 0],
  rearHip: [0.28, 0, 0],
  rearKnee: [0.82, 0, 0],
}

const FORWARD_TRAVEL: FightPose = {
  root: [0, 0.04, 0.12],
  body: [0.34, 0, 0],
  chest: [0.12, -0.22, 0],
  head: [-0.12, 0, 0],
  leadHip: [-0.75, 0, 0],
  leadKnee: [0.42, 0, 0],
  rearHip: [0.5, 0, 0],
  rearKnee: [0.28, 0, 0],
  leadShoulder: [0.18, 0, 0.2],
  rearShoulder: [-0.18, 0, -0.2],
}

const FORWARD_CATCH: FightPose = {
  root: [0, -0.04, 0.04],
  body: [0.12, 0, 0],
  leadHip: [0.12, 0, 0],
  leadKnee: [0.55, 0, 0],
  rearHip: [-0.32, 0, 0],
  rearKnee: [0.42, 0, 0],
}

const BACK_PUSH: FightPose = {
  root: [0, -0.05, 0.05],
  body: [-0.18, 0, 0],
  chest: [-0.08, 0.12, 0],
  leadHip: [0.32, 0, 0],
  leadKnee: [0.7, 0, 0],
  rearHip: [-0.42, 0, 0],
  rearKnee: [0.5, 0, 0],
  leadShoulder: [-0.2, 0, 0.15],
  rearShoulder: [-0.15, 0, -0.15],
}

const BACK_TRAVEL: FightPose = {
  root: [0, 0.08, -0.1],
  body: [-0.28, 0, 0],
  chest: [-0.1, 0.18, 0],
  head: [0.1, 0, 0],
  leadHip: [0.5, 0, 0],
  leadKnee: [0.28, 0, 0],
  rearHip: [-0.7, 0, 0],
  rearKnee: [0.35, 0, 0],
  leadShoulder: [-0.35, 0, 0.2],
  leadElbow: [-0.35, 0, 0],
  rearShoulder: [-0.28, 0, -0.2],
  rearElbow: [-0.3, 0, 0],
}

const BACK_CATCH: FightPose = {
  root: [0, -0.06, -0.03],
  body: [-0.08, 0, 0],
  leadHip: [-0.28, 0, 0],
  leadKnee: [0.48, 0, 0],
  rearHip: [0.12, 0, 0],
  rearKnee: [0.58, 0, 0],
}

/** Family accents keep the fighter's authored guard but change how the body carries momentum. */
const DASH_ACCENTS: Record<FightFamily, FightPose> = {
  striker: { chest: [0.04, -0.08, 0], rearShoulder: [-0.12, 0, -0.08] },
  kicker: {
    body: [-0.04, 0, 0],
    leadHip: [-0.22, 0, 0.08],
    rearHip: [0.2, 0, -0.08],
    leadShoulder: [0.15, 0, 0.25],
  },
  blade: {
    body: [0.12, 0, 0],
    chest: [0.16, -0.12, 0],
    leadShoulder: [-0.25, 0, -0.18],
    rearShoulder: [0.18, 0, 0.12],
  },
  caster: {
    body: [-0.08, 0, 0],
    chest: [-0.05, -0.15, 0],
    leadShoulder: [-0.18, 0, 0.15],
    leadElbow: [-0.28, 0, 0],
    rearElbow: [-0.22, 0, 0],
  },
  brute: {
    root: [0, -0.05, 0],
    body: [0.16, 0, 0],
    chest: [0.08, 0, 0],
    leadKnee: [0.18, 0, 0],
    rearKnee: [0.22, 0, 0],
    leadShoulder: [0.1, 0, 0.28],
    rearShoulder: [0.08, 0, -0.28],
  },
}

export interface DashPose {
  pose: FightPose
  forward: boolean
}

export function dashPose(fighter: ArcadeFighter, standing: FightPose): DashPose | null {
  const dash = motionOf(fighter).dash
  if (!dash) return null
  const forward = dash.direction === fighter.facing
  const progress = Math.min(1, Math.max(0, dash.frame / dash.frames))
  const poses = forward
    ? [FORWARD_PUSH, FORWARD_TRAVEL, FORWARD_CATCH]
    : [BACK_PUSH, BACK_TRAVEL, BACK_CATCH]
  const accent = dashAccent(fighter, progress, forward)
  return { pose: addPoses(standing, sampleThreeBeat(poses, progress), accent), forward }
}

function dashAccent(fighter: ArcadeFighter, progress: number, forward: boolean): FightPose {
  const strength = Math.sin(progress * Math.PI) * (forward ? 1 : 0.7)
  return scalePose(DASH_ACCENTS[fightFamily(fighter.id)], strength)
}

function sampleThreeBeat(poses: FightPose[], progress: number): FightPose {
  if (progress < 0.24) return lerpPose(poses[0], poses[1], easeOut(progress / 0.24))
  return lerpPose(poses[1], poses[2], easeInOut((progress - 0.24) / 0.76))
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 3
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value)
}

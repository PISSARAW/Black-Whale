import { hanzoDashPoses, HANZO_WALK_STYLE } from './hanzoLocomotion'
import { chrolloDashPoses, CHROLLO_WALK_STYLE } from './chrolloLocomotion'
import { fightFamily, type FightFamily } from './fightArchetypes'
import { fighterMotionProfile } from './fighterMotionProfile'
import { addPoses, lerpPose, scalePose, type FightPose } from './fightPose'
import { defensiveStance } from './fightDefensiveStance'
import { LANDING_FRAMES, motionOf, PREJUMP_FRAMES } from './fighterMovement'
import type { ArcadeFighter, FighterId } from './types'
import { feitanDashPoses, FEITAN_WALK_STYLE } from './feitanLocomotion'
import { hisokaDashPoses, HISOKA_WALK_STYLE } from './hisokaLocomotion'
import { shufflePhase, shufflePose } from './fightShuffleStep'
import { physicalWalkAccent } from './fightLocomotionInertia'
import { kurapikaDashPoses, KURAPIKA_WALK_STYLE } from './kurapikaLocomotion'
import { benjaminDashPoses, BENJAMIN_WALK_STYLE } from './benjaminLocomotion'
import { combatLocomotion, combatWalk } from './firstFiveCombatMotion'

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

export interface WalkStyle {
  advance: FightPose
  retreat: FightPose
  rhythm: FightPose
}

const PERSONAL_WALKS: Partial<Record<FighterId, WalkStyle>> = {
  chrollo: CHROLLO_WALK_STYLE,
  hisoka: HISOKA_WALK_STYLE,
  feitan: FEITAN_WALK_STYLE,
  hanzo: HANZO_WALK_STYLE,
  kurapika: KURAPIKA_WALK_STYLE,
  benjamin: BENJAMIN_WALK_STYLE,
}
const PERSONAL_DASHES: Partial<Record<FighterId, (forward: boolean) => FightPose[]>> = {
  chrollo: chrolloDashPoses,
  hisoka: hisokaDashPoses,
  feitan: feitanDashPoses,
  hanzo: hanzoDashPoses,
  kurapika: kurapikaDashPoses,
  benjamin: benjaminDashPoses,
}

const WALK_STYLES: Record<FightFamily, WalkStyle> = {
  striker: {
    advance: { body: [0.08, 0, 0], chest: [0.03, -0.08, 0] },
    retreat: { body: [-0.06, 0, 0], chest: [-0.04, 0.06, 0] },
    rhythm: { chest: [0, 0, 0.025], leadShoulder: [0.08, 0, 0], rearShoulder: [-0.08, 0, 0] },
  },
  kicker: {
    advance: { body: [0.02, 0, 0], chest: [-0.02, -0.04, 0] },
    retreat: { body: [-0.05, 0, 0], chest: [-0.04, 0.06, 0] },
    rhythm: { chest: [0, 0, 0.05], leadShoulder: [0.16, 0, 0.14], rearShoulder: [-0.16, 0, -0.14] },
  },
  blade: {
    advance: { body: [0.13, 0, 0], chest: [0.11, -0.08, 0], head: [-0.08, 0, 0] },
    retreat: { body: [0.04, 0, 0], chest: [0.06, 0.04, 0] },
    rhythm: { chest: [0, 0, 0.02], rearShoulder: [-0.05, 0, 0.06] },
  },
  caster: {
    advance: { body: [-0.03, 0, 0], chest: [-0.04, -0.06, 0] },
    retreat: { body: [-0.1, 0, 0], chest: [-0.07, 0.08, 0] },
    rhythm: { leadShoulder: [0.04, 0, 0.03], rearShoulder: [-0.04, 0, -0.03] },
  },
  brute: {
    advance: { body: [0.17, 0, 0], chest: [0.09, 0, 0] },
    retreat: { body: [-0.03, 0, 0], chest: [0.02, 0.04, 0] },
    rhythm: { chest: [0, 0, 0.045], leadShoulder: [0.1, 0, 0.09], rearShoulder: [-0.1, 0, -0.09] },
  },
}

const PREJUMP: FightPose = {
  root: [0, -0.04, 0],
  body: [0.16, 0, 0],
  chest: [0.08, 0, 0],
  head: [-0.12, 0, 0],
  leadHip: [-0.42, 0, 0],
  leadKnee: [0.7, 0, 0],
  rearHip: [-0.34, 0, 0],
  rearKnee: [0.62, 0, 0],
}

const LANDING: FightPose = {
  root: [0, -0.08, 0],
  body: [0.22, 0, 0],
  chest: [0.12, 0, 0],
  head: [-0.16, 0, 0],
  leadHip: [-0.58, 0, 0],
  leadKnee: [0.9, 0, 0],
  rearHip: [-0.5, 0, 0],
  rearKnee: [0.82, 0, 0],
  leadShoulder: [0.12, 0, 0.18],
  rearShoulder: [0.1, 0, -0.18],
}

export interface LocomotionPose {
  pose: FightPose
  key: string
  blend: number
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
  const poses =
    PERSONAL_DASHES[fighter.id]?.(forward) ??
    (forward ? [FORWARD_PUSH, FORWARD_TRAVEL, FORWARD_CATCH] : [BACK_PUSH, BACK_TRAVEL, BACK_CATCH])
  const profile = fighterMotionProfile(fighter.id)
  const accent = dashAccent(fighter, progress, forward)
  const travel = scalePose(sampleThreeBeat(poses, progress), profile.dash)
  return { pose: addPoses(standing, travel, accent), forward }
}

export function prejumpPose(fighter: ArcadeFighter, standing: FightPose): LocomotionPose | null {
  const frames = motionOf(fighter).prejumpFrames
  if (!(frames > 0)) return null
  const profile = fighterMotionProfile(fighter.id)
  const compression = 1 - frames / PREJUMP_FRAMES
  const style = combatLocomotion(fighter)
  return {
    pose: addPoses(
      standing,
      scalePose(
        addPoses(PREJUMP, style?.takeoff ?? style?.jump ?? {}),
        easeInOut(compression) * profile.jump,
      ),
    ),
    key: 'prejump',
    blend: 1 / 60,
  }
}

export function landingPose(fighter: ArcadeFighter, standing: FightPose): LocomotionPose | null {
  const frames = motionOf(fighter).landingFrames
  if (!(frames > 0)) return null
  const profile = fighterMotionProfile(fighter.id)
  const compression = frames / LANDING_FRAMES
  const style = combatLocomotion(fighter)
  return {
    pose: addPoses(
      standing,
      scalePose(
        addPoses(LANDING, style?.landing ?? style?.jump ?? {}),
        easeOut(compression) * profile.landing,
      ),
    ),
    key: 'landing',
    blend: 1 / 60,
  }
}

export function walkPose(fighter: ArcadeFighter, standing: FightPose): LocomotionPose {
  const motion = motionOf(fighter)
  const advancing = motion.heldDirection === fighter.facing
  const personal = PERSONAL_WALKS[fighter.id]
  const style = personal ?? WALK_STYLES[fightFamily(fighter.id)]
  const profile = fighterMotionProfile(fighter.id)
  const phase = shufflePhase(fighter)
  const rhythm = scalePose(style.rhythm, Math.sin(phase) * profile.walk * (advancing ? 1 : 0.65))
  const posture = scalePose(advancing ? style.advance : style.retreat, profile.walk)
  const signature = combatLocomotion(fighter)
  const accent = signature
    ? scalePose(combatWalk(signature, phase, advancing), profile.walk)
    : personal
      ? {}
      : scalePose(physicalWalkAccent(fighter, advancing), profile.walk)
  const steps = shufflePose(fighter)
  return {
    pose: addPoses(standing, posture, accent, rhythm, scalePose(steps, profile.walk)),
    key: advancing ? 'walk:forward' : 'walk:backward',
    blend: 0.055,
  }
}

export function locomotionGuard(fighter: ArcadeFighter, standing: FightPose): FightPose {
  const signature = combatLocomotion(fighter)
  return signature ? addPoses(defensiveStance(standing), signature.guard) : defensiveStance(standing)
}

function dashAccent(fighter: ArcadeFighter, progress: number, forward: boolean): FightPose {
  const profile = fighterMotionProfile(fighter.id)
  const strength = Math.sin(progress * Math.PI) * profile.dash * (forward ? 1 : 0.7)
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

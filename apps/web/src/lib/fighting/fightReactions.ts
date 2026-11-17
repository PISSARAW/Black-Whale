import {
  addPoses,
  lerpPose,
  pickJoints,
  scalePose,
  UPPER_JOINTS,
  type BodyPlan,
  type FightPose,
} from './fightPose'
import { AIR_POSE, CROUCH_POSE } from './fightStance'
import type { KeyPose, MoveTimeline } from './keyPoseTimeline'
import { sampleTimeline } from './keyPoseTimeline'
import type { ArcadeFighter, FightNenZone } from './types'

/**
 * What happens to a body when it is not the one attacking: struck, knocked
 * down, getting up, knocked out, or simply in the air.
 *
 * A struck fighter snaps into the recoil in the frame it is hit — head thrown
 * back, folded over the stomach, or a leg kicked out — holds it through most of
 * the hitstun, then finds its guard again. A knockdown staggers, falls on its
 * back away from the opponent and bounces once; the wake-up rolls to a crouch
 * before standing. All of it rides the same progress the scene already measures
 * (`sceneMotion.poseProgress`), so the timing stays the engine's.
 */
export interface ReactionContext {
  /** 0 when the state starts, 1 when it ends (`sceneMotion.poseProgress`). */
  progress: number
  /** Where the last blow landed, for a struck fighter. */
  hitZone?: FightNenZone
}

const HIT: Record<FightNenZone, FightPose> = {
  head: {
    root: [0, 0, -0.08],
    body: [-0.18, 0, 0],
    chest: [-0.25, 0.15, 0.08],
    head: [-0.55, 0, 0.3],
    leadShoulder: [0.4, 0, 0.3],
    rearShoulder: [0.3, 0, -0.3],
    leadElbow: [0.6, 0, 0],
    leadKnee: [0.15, 0, 0],
    rearKnee: [0.2, 0, 0],
  },
  torso: {
    root: [0, 0, -0.1],
    body: [0.15, 0, 0],
    chest: [0.35, 0.2, 0],
    head: [0.3, 0, 0],
    leadShoulder: [0.5, 0, 0.2],
    rearShoulder: [0.4, 0, -0.2],
    leadElbow: [0.7, 0, 0],
    rearElbow: [0.6, 0, 0],
    leadKnee: [0.3, 0, 0],
    rearKnee: [0.35, 0, 0],
  },
  // A blow taken on the guard's hands: forearms knocked back, the body barely moves.
  hands: {
    root: [0, 0, -0.05],
    body: [-0.06, 0, 0],
    chest: [-0.08, 0.1, 0],
    leadShoulder: [0.55, 0, 0.15],
    rearShoulder: [0.4, 0, -0.1],
    leadElbow: [-0.4, 0, 0],
    leadWrist: [0.5, 0, 0],
  },
  feet: {
    body: [0.1, 0, 0.15],
    chest: [0.1, 0, 0.1],
    leadHip: [0.35, 0, 0],
    leadKnee: [0.6, 0, 0],
    rearKnee: [0.2, 0, 0],
    leadShoulder: [0.2, 0, 0.5],
    rearShoulder: [0, 0, -0.4],
  },
}

/** Flat on the back, away from the opponent, arms flung out. */
const LYING: FightPose = {
  body: [-1.5, 0, 0],
  chest: [0, -0.2, 0],
  head: [0.25, 0, 0.2],
  leadShoulder: [-0.3, 0, 1],
  rearShoulder: [-0.2, 0, -1.1],
  leadElbow: [-0.45, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.25, 0, 0.1],
  leadKnee: [0.7, 0, 0],
  rearHip: [-0.05, 0, -0.1],
  rearKnee: [0.2, 0, 0],
}

const LAUNCHED: FightPose = {
  body: [-0.7, 0, 0],
  chest: [-0.2, 0, 0],
  head: [-0.3, 0, 0],
  leadShoulder: [0.5, 0, 0.8],
  rearShoulder: [0.5, 0, -0.8],
  leadElbow: [1.2, 0, 0],
  rearElbow: [1.4, 0, 0],
  leadHip: [-0.6, 0, 0],
  leadKnee: [0.8, 0, 0],
}

const SITTING_UP: FightPose = {
  body: [-0.6, 0, 0],
  chest: [0.3, 0, 0],
  leadHip: [-1.3, 0, 0.1],
  leadKnee: [1.8, 0, 0],
  rearHip: [-1, 0, -0.1],
  rearKnee: [2, 0, 0],
  leadShoulder: [0.4, 0, 0.4],
  rearShoulder: [0.6, 0, -0.4],
  leadElbow: [1.4, 0, 0],
  rearElbow: [1.7, 0, 0],
}

/** Progress is drawn on a hundred-frame scale so the timeline's keys read as percentages. */
const SCALE = { startup: 0, active: 0, recovery: 100 }

function key(at: number, pose: FightPose, ease: KeyPose['ease'] = 'smooth'): KeyPose {
  return { phase: 'recovery', at, pose, ease }
}

function sample(timeline: MoveTimeline, progress: number, settle = true): FightPose {
  return sampleTimeline(timeline, { frame: progress * 100, frames: SCALE, settle })
}

function hitTimeline(zone: FightNenZone): MoveTimeline {
  const recoil = HIT[zone]
  return [key(0, recoil, 'snap'), key(0.55, scalePose(recoil, 0.8), 'out')]
}

function fallTimeline(stagger: FightPose): MoveTimeline {
  return [
    key(0, stagger, 'snap'),
    key(0.18, LAUNCHED, 'out'),
    key(0.4, LYING, 'in'),
    key(0.48, addPoses(LYING, { body: [0.15, 0, 0], leadKnee: [0.3, 0, 0] }), 'out'),
    key(0.58, LYING, 'in'),
  ]
}

const KNOCKDOWN = fallTimeline(HIT.head)
const WAKEUP: MoveTimeline = [
  key(0, LYING, 'snap'),
  key(0.35, SITTING_UP, 'out'),
  key(0.7, CROUCH_POSE, 'smooth'),
]

/** A plan for every non-attacking state the rig draws; `null` leaves it to the scene. */
export function reactionPlan(
  fighter: ArcadeFighter,
  context: ReactionContext,
  standing: FightPose,
): BodyPlan | null {
  const { progress } = context
  const grounded = fighter.y <= 0
  switch (fighter.pose) {
    case 'hit':
      return hitPlan(fighter, context, standing)
    case 'down':
      return {
        pose: sample(KNOCKDOWN, grounded ? progress : Math.min(progress, 0.18), false),
        plant: false,
        key: 'down',
        blend: 0.03,
      }
    case 'ko':
      return {
        pose: sample(KNOCKDOWN, grounded ? progress : Math.min(progress, 0.18), false),
        plant: false,
        key: 'ko',
        blend: 0.03,
      }
    case 'wakeup':
      return {
        pose: lerpPose(
          sample(WAKEUP, progress, false),
          standing,
          Math.max(0, (progress - 0.7) / 0.3),
        ),
        plant: false,
        key: 'wakeup',
        blend: 0.05,
      }
    case 'jump':
      return jumpPlan(progress, standing)
    default:
      return null
  }
}

function hitPlan(fighter: ArcadeFighter, context: ReactionContext, standing: FightPose): BodyPlan {
  const recoil = sample(hitTimeline(context.hitZone ?? 'torso'), context.progress)
  const airborne = fighter.y > 0
  const juggled = airborne ? addPoses(recoil, LAUNCHED) : recoil
  return { pose: addPoses(standing, juggled), plant: !airborne, key: 'hit', blend: 0.02 }
}

function jumpPlan(progress: number, standing: FightPose): BodyPlan {
  // Legs stretch on take-off and landing, tuck at the apex.
  const tuck = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI)
  const pose = addPoses(pickJoints(standing, UPPER_JOINTS), scalePose(AIR_POSE, 0.35 + 0.65 * tuck))
  return { pose, plant: false, key: 'jump', blend: 0.06 }
}

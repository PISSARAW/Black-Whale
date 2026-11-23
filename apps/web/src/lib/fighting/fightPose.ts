import { interpolateJointTurn } from './fightPoseSlerp'

/**
 * A fighting pose: joint offsets added on top of the shared body's rest pose.
 *
 * Poses are authored once, for a fighter facing right, in terms of the *lead*
 * side (the arm and leg nearest the opponent, upstage) and the *rear* side.
 * Facing left mirrors them, the way a 2D fighter's sprite is flipped: the lead
 * swaps to the other limb and turns about the vertical axis change sign.
 *
 * Conventions, in the figure's own space (it faces +z):
 * - `body`, `chest`: x > 0 leans forward, y < 0 opens the chest to the camera
 *   and brings the lead shoulder forward, z tilts sideways.
 * - shoulders and hips: x < 0 swings the limb forward and up, z > 0 opens it
 *   away from the body.
 * - elbows: x < 0 bends. Knees: x > 0 bends. Wrists and ankles: x tilts.
 * - `neck`, palms and feet are additive articulation layered after head, wrist
 *   and ankle motion. Clavicles are local shoulder translations
 *   `[inward, lift, protract]`, not Euler turns.
 * - `root`: a position offset [sideways, up, forward] of the whole figure.
 */
export type Turn = readonly [number, number, number]

export const FIGHT_JOINTS = [
  'root',
  'pelvis',
  'body',
  'chest',
  'neck',
  'head',
  'leadClavicle',
  'rearClavicle',
  'leadShoulder',
  'rearShoulder',
  'leadElbow',
  'rearElbow',
  'leadWrist',
  'rearWrist',
  'leadPalm',
  'rearPalm',
  'leadHip',
  'rearHip',
  'leadKnee',
  'rearKnee',
  'leadFoot',
  'rearFoot',
] as const

export type FightJoint = (typeof FIGHT_JOINTS)[number]
export type FightPose = Partial<Record<FightJoint, Turn>>

const ZERO: Turn = [0, 0, 0]

export const NEUTRAL_POSE: FightPose = {}

function scaleTurn(turn: Turn, amount: number): Turn {
  return [turn[0] * amount, turn[1] * amount, turn[2] * amount]
}

function jointsOf(...poses: FightPose[]): FightJoint[] {
  return FIGHT_JOINTS.filter((joint) => poses.some((pose) => pose[joint]))
}

export function lerpPose(from: FightPose, to: FightPose, amount: number): FightPose {
  const blended: FightPose = {}
  for (const joint of jointsOf(from, to)) {
    blended[joint] = interpolateJointTurn(
      joint,
      { from: from[joint] ?? ZERO, to: to[joint] ?? ZERO },
      amount,
    )
  }
  return blended
}

export function addPoses(...poses: FightPose[]): FightPose {
  const summed: FightPose = {}
  for (const joint of jointsOf(...poses)) {
    summed[joint] = poses.reduce<Turn>((total, pose) => addTurn(total, pose[joint] ?? ZERO), ZERO)
  }
  return summed
}

function addTurn(a: Turn, b: Turn): Turn {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function scalePose(pose: FightPose, amount: number): FightPose {
  const scaled: FightPose = {}
  for (const joint of jointsOf(pose)) {
    scaled[joint] = scaleTurn(pose[joint] ?? ZERO, amount)
  }
  return scaled
}

/** Keep only the listed joints: a walk keeps the stance's upper body, not its legs. */
export function pickJoints(pose: FightPose, joints: readonly FightJoint[]): FightPose {
  const picked: FightPose = {}
  for (const joint of joints) if (pose[joint]) picked[joint] = pose[joint]
  return picked
}

export const UPPER_JOINTS: readonly FightJoint[] = [
  'chest',
  'neck',
  'head',
  'leadClavicle',
  'rearClavicle',
  'leadShoulder',
  'rearShoulder',
  'leadElbow',
  'rearElbow',
  'leadWrist',
  'rearWrist',
  'leadPalm',
  'rearPalm',
]

export const STANCE_FRAME_JOINTS: readonly FightJoint[] = [
  'body',
  'chest',
  'neck',
  'head',
  'leadHip',
  'rearHip',
  'leadKnee',
  'rearKnee',
]

/** What the fighting rig draws on one frame, and how it eases into it. */
export interface BodyPlan {
  pose: FightPose
  /** Keep the lower foot on the floor (off in the air). */
  plant: boolean
  /** A change of key starts a cross-fade from the last drawn pose. */
  key: string
  /** Cross-fade length in seconds; 0 snaps. */
  blend: number
  attackFlow?: import('./fightAttackFlow').AttackFlowFrame
  /** Simulation age of a contact reaction; repeated renders during hitstop keep the same pose. */
  reactionFrame?: number
  /** Optional authored base of support for a planted presentation pose. */
  supportFoot?: 'lead' | 'rear'
  /** A planted foot may rotate around its anchor without translating. */
  pivotFoot?: 'lead' | 'rear'
  pivotAngle?: number
}

import { addPoses, scalePose, type BodyPlan, type FightPose } from './fightPose'
import { motionOf } from './fighterMovement'
import { PHYSICAL_LOCOMOTION } from './physicalLocomotion'
import { SWAY_FRAMES } from './movementTech'
import { UKEMI_ROLL_FRAMES } from './wakeupMovement'
import type { ArcadeFighter } from './types'

const SWAY_POSE: FightPose = {
  root: [0, -0.04, -0.14],
  body: [-0.34, 0, 0],
  chest: [-0.18, 0.12, 0],
  head: [0.18, 0, 0],
  leadHip: [0.22, 0, 0],
  leadKnee: [0.35, 0, 0],
  rearHip: [-0.26, 0, 0],
  rearKnee: [0.48, 0, 0],
  leadShoulder: [-0.32, 0, 0.18],
  rearShoulder: [-0.24, 0, -0.18],
}

const LOW_SLIDE_POSE: FightPose = {
  root: [0, -0.24, 0.1],
  body: [0.42, 0, 0],
  chest: [0.18, -0.16, 0],
  head: [-0.22, 0, 0],
  leadHip: [-0.88, 0, 0],
  leadKnee: [1.18, 0, 0],
  rearHip: [0.36, 0, 0],
  rearKnee: [1.05, 0, 0],
  leadShoulder: [0.22, 0, 0.24],
  rearShoulder: [-0.28, 0, -0.24],
}

const UKEMI_TUCK_POSE: FightPose = {
  root: [0, -0.34, 0],
  body: [1.15, 0, 0],
  chest: [0.45, 0, 0],
  head: [0.35, 0, 0],
  leadHip: [-1.1, 0, 0],
  leadKnee: [1.65, 0, 0],
  rearHip: [-1.05, 0, 0],
  rearKnee: [1.6, 0, 0],
  leadShoulder: [-0.6, 0, 0.3],
  leadElbow: [-0.9, 0, 0],
  rearShoulder: [-0.6, 0, -0.3],
  rearElbow: [-0.9, 0, 0],
}

/**
 * Dedicated 3D poses for Ukemi rolls, Back Sway, and crouched Low Slides.
 * Returns null when no special movement tech is active so normal locomotion runs.
 */
export function movementTechPose(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  if (fighter.ukemiRoll) return ukemiPlan(fighter, standing)
  if (motionOf(fighter).dash?.lowDodge) return lowSlidePlan(fighter, standing)
  if ((fighter.swayFrames ?? 0) > 0) return swayPlan(fighter, standing)
  return null
}

function ukemiPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan {
  const roll = fighter.ukemiRoll!
  const progress = 1 - roll.frames / UKEMI_ROLL_FRAMES
  const arc = Math.sin(progress * Math.PI)
  const dir = roll.direction === fighter.facing ? 1 : -1
  const tuck: FightPose = {
    ...UKEMI_TUCK_POSE,
    body: [UKEMI_TUCK_POSE.body![0] * dir, 0, 0],
  }
  const catchPose = PHYSICAL_LOCOMOTION[fighter.id]?.landing ?? {}
  return {
    pose: addPoses(standing, scalePose(tuck, arc), scalePose(catchPose, arc * 0.35)),
    plant: true,
    key: `ukemi:${dir}`,
    blend: 0.03,
  }
}

function lowSlidePlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan {
  const dash = motionOf(fighter).dash!
  const progress = Math.min(1, Math.max(0, dash.frame / Math.max(1, dash.frames)))
  const strength = Math.sin(progress * Math.PI) * 0.85 + 0.15
  return {
    pose: addPoses(standing, scalePose(LOW_SLIDE_POSE, strength)),
    plant: true,
    key: 'dash:low-slide',
    blend: 0.025,
  }
}

function swayPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan {
  const progress = 1 - (fighter.swayFrames ?? 0) / SWAY_FRAMES
  const strength = Math.sin(progress * Math.PI)
  const retreat = PHYSICAL_LOCOMOTION[fighter.id]?.backward[1]
  const sway = retreat ? addPoses(scalePose(SWAY_POSE, 0.48), retreat) : SWAY_POSE
  return {
    pose: addPoses(standing, scalePose(sway, strength)),
    plant: true,
    key: 'sway:back',
    blend: 0.03,
  }
}

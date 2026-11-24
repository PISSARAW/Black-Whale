import { addPoses, scalePose, type BodyPlan, type FightPose } from './fightPose'
import { AIR_POSE } from './fightStance'
import { FEITAN_JUMP } from './secondFiveLocomotion'
import type { ArcadeFighter } from './types'

/** Low acceleration, free arm trailing, eyes fixed ahead: reference 0:20–1:10. */
export const FEITAN_WALK_STYLE = {
  advance: {
    body: [0.18, 0, 0],
    chest: [0.08, -0.08, 0],
    head: [-0.18, 0, 0],
    leadShoulder: [0.15, 0, 0.08],
    leadElbow: [-0.45, 0, 0],
    rearShoulder: [0.5, 0, -0.3],
    rearElbow: [-0.35, 0, 0],
    leadHip: [-0.55, 0, 0.04],
    leadKnee: [0.82, 0, 0],
    rearHip: [-0.35, 0, -0.04],
    rearKnee: [0.68, 0, 0],
  },
  retreat: {
    body: [0.02, 0, 0],
    chest: [0.02, 0.08, 0],
    head: [-0.08, 0, 0],
    leadElbow: [-0.35, 0, 0],
    rearShoulder: [0.18, 0, -0.15],
    leadHip: [-0.4, 0, 0],
    leadKnee: [0.7, 0, 0],
    rearHip: [-0.3, 0, 0],
    rearKnee: [0.6, 0, 0],
  },
  rhythm: { chest: [0, 0.035, 0], rearShoulder: [0.08, 0, 0.04] },
} satisfies Record<string, FightPose>

export function feitanDashPoses(forward: boolean): FightPose[] {
  return forward ? FORWARD : BACKWARD
}

const FORWARD: FightPose[] = [
  {
    body: [0.12, 0, 0],
    leadHip: [-0.8, 0, 0],
    leadKnee: [1.1, 0, 0],
    rearHip: [-0.55, 0, 0],
    rearKnee: [1, 0, 0],
  },
  {
    body: [0.3, 0, 0],
    chest: [0.1, -0.1, 0],
    head: [-0.27, 0, 0],
    leadShoulder: [0.25, 0, 0.12],
    leadElbow: [-0.55, 0, 0],
    rearShoulder: [0.65, 0, -0.4],
    rearElbow: [-0.35, 0, 0],
    leadHip: [-1, 0, 0.06],
    leadKnee: [1.18, 0, 0],
    rearHip: [-0.32, 0, -0.06],
    rearKnee: [0.78, 0, 0],
  },
  {
    body: [0.08, 0, 0],
    leadHip: [-0.55, 0, 0],
    leadKnee: [0.85, 0, 0],
    rearHip: [-0.4, 0, 0],
    rearKnee: [0.75, 0, 0],
  },
]
const BACKWARD: FightPose[] = [
  { body: [-0.12, 0, 0], chest: [0, 0.2, 0], leadKnee: [0.6, 0, 0], rearKnee: [0.5, 0, 0] },
  {
    body: [0.04, 0, 0],
    chest: [0.02, 0.16, 0],
    head: [-0.1, 0, 0],
    leadShoulder: [-0.65, 0, 0.08],
    leadElbow: [-0.3, 0, 0],
    leadWrist: [-0.4, 0, 0],
    rearShoulder: [0.2, 0, -0.5],
    rearElbow: [0.5, 0, 0],
    leadHip: [-0.45, 0, 0],
    leadKnee: [0.82, 0, 0],
    rearHip: [-0.78, 0, 0],
    rearKnee: [1.05, 0, 0],
  },
  { body: [0.06, 0, 0], chest: [0, 0.1, 0], leadKnee: [0.4, 0, 0], rearKnee: [0.6, 0, 0] },
]

/** Presentation follows the existing jump arc and cannot move the collision body. */
export function feitanAirPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  if (fighter.id !== 'feitan' || fighter.pose !== 'jump') return null
  const tuck = Math.max(0, 1 - Math.abs(fighter.velocityY) / 54)
  return {
    pose: addPoses(
      standing,
      scalePose(AIR_POSE, 0.4 + tuck * 0.6),
      scalePose(FEITAN_JUMP, 0.68 + tuck * 0.32),
      {
        rearShoulder: [0.65, 0, -0.6],
        rearElbow: [-0.45, 0, 0],
        leadShoulder: [-0.55, 0, 0.2],
        leadElbow: [-1.1, 0, 0],
        leadWrist: [0.2, 0, 0],
      },
    ),
    plant: false,
    key: 'feitan:air',
    blend: 0.045,
  }
}

import type { HumanMotion } from '$lib/tour/humanAnimation'
import type { ArcadeFighter } from './types'
import {
  FACE_CONTROLS,
  REST_FACE,
  fightExpressionTarget,
  type FightFacePose,
} from './fightExpressions'
import { drawFightFace, fightFaceRig, type FightFaceRig } from './fightExpressionRig'

interface ExpressionContext {
  fighter: ArcadeFighter
  seconds: number
  progress: number
}

/** Presentation only: reads the same attack/reaction clocks as the existing body motion. */
export function expressiveFightMotion(
  context: ExpressionContext,
  motion: HumanMotion,
): HumanMotion {
  return (human) => {
    motion(human)
    const rig = fightFaceRig(human.figure)
    if (!rig) return
    if (!rig.active) {
      drawFightFace(rig, REST_FACE)
      rig.pose = null
      return
    }
    const target = fightExpressionTarget(context.fighter, context.progress)
    const pose = blendFace(rig, { target: target.pose, seconds: context.seconds })
    rig.mode = target.mode
    drawFightFace(rig, context.fighter.melodyPerformance ? { ...pose, eye: 0.12 } : pose)
    if (context.fighter.melodyPerformance) return
    human.head.rotation.x += pose.headPitch
    human.head.rotation.y += pose.headYaw
    human.head.rotation.z += pose.headRoll * context.fighter.facing
    const breath = (1 + Math.sin(context.seconds * Math.PI * 2 * 0.8)) * 0.0012
    for (const arm of human.arms) arm.position.y += pose.shoulder + breath
  }
}

function blendFace(rig: FightFaceRig, input: { target: FightFacePose; seconds: number }) {
  const { target, seconds } = input
  const dt = seconds - rig.seconds
  if (!rig.pose || dt < 0 || dt > 0.5) rig.pose = { ...target }
  const pose = rig.pose
  const takingHit = target.pain > pose.pain
  const time = takingHit ? 0.018 : 0.1
  const alpha = Math.max(takingHit ? 0.8 : 0, 1 - Math.exp(-Math.max(0, dt) / time))
  // A hit reads on its first drawn frame even after another pose at the same timestamp.
  pose.pain = Math.max(pose.pain, target.pain * 0.8)
  for (const control of FACE_CONTROLS) pose[control] += (target[control] - pose[control]) * alpha
  if (target.pain > 0) {
    pose.smile = 0
    pose.effort = 0
  }
  rig.seconds = seconds
  return pose
}

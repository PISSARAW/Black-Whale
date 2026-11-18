import { Vector3 } from 'three'
import { humanAnimationRig, type AnimatedHuman } from '$lib/tour/humanAnimation'
import { lowestBodyHeight } from '../fightGroundContact'
import { supportThrowLeg } from './support'
import { sampleThrowBeat, throwSmooth } from './sample'
import { throwPerformance } from './catalogue'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'

const CLEARANCE = 0.012

/** Whole-body rotation is about the pelvis; soles are supports only while actually grounded. */
export function poseThrowPhysics(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  for (const side of [frame.attacker, frame.victim]) {
    const figure = options.figureOf?.(side)
    const human = figure && humanAnimationRig(figure)
    if (!human) continue
    pivotThrowBody(human)
    if (side === frame.attacker) supportThrower(human, frame)
    else landVictim(human, frame)
  }
}

/** Props and constrained contacts may adjust limbs after the support solve. */
export function settleThrowPhysics(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  for (const side of [frame.attacker, frame.victim]) {
    const figure = options.figureOf?.(side),
      human = figure && humanAnimationRig(figure)
    if (human) keepAboveFloor(human)
  }
}

export function pivotThrowBody(human: AnimatedHuman) {
  const pivot = new Vector3(0, human.legs[0].position.y, 0).multiply(human.figure.scale)
  human.figure.position.add(pivot.clone().sub(pivot.applyQuaternion(human.figure.quaternion)))
  human.figure.updateWorldMatrix(false, false)
}

function supportThrower(human: AnimatedHuman, frame: ThrowCinematicFrame) {
  const performance = throwPerformance(frame.performance)
  const t = frame.age / frame.duration
  const beat = performance && sampleThrowBeat(performance, t)
  if ((beat?.actorPath?.[1] ?? 0) > 0.01) return keepAboveFloor(human)
  const hip = human.legs[0].position.y
  const bend = human.knees.reduce((sum, knee) => sum + 1 - Math.cos(knee.rotation.x / 2), 0) / 2
  human.figure.position.y -= Math.min(hip * 0.3, hip * bend)
  for (const index of [0, 1]) supportThrowLeg(human, frame, index)
  keepAboveFloor(human)
}

function landVictim(human: AnimatedHuman, frame: ThrowCinematicFrame) {
  const t = frame.age / frame.duration
  const lowest = lowestBodyHeight(human)
  const weight = throwSmooth((t - 0.66) / 0.14)
  if (lowest > CLEARANCE) translateHeight(human, (CLEARANCE - lowest) * weight)
  keepAboveFloor(human)
}

function keepAboveFloor(human: AnimatedHuman) {
  const lowest = lowestBodyHeight(human)
  if (lowest < CLEARANCE) translateHeight(human, CLEARANCE - lowest)
}
function translateHeight(human: AnimatedHuman, y: number) {
  const figure = human.figure,
    parent = figure.parent!
  const origin = figure.getWorldPosition(new Vector3())
  origin.y += y
  figure.position.copy(parent.worldToLocal(origin))
}

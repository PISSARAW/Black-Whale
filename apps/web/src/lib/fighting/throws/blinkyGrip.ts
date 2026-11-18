import { Quaternion, Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { blinkyAvailable } from '../blinky'
import { fightRigOf } from '../fightRig'
import { reachLimb } from '../fightLimbReach'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Swing the carried Blinky around the wrist; the living target never enters its mouth. */
export function poseThrowBlinky(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.performance?.startsWith('shizuku') || !blinkyAvailable(state[frame.attacker])) return
  const bodies = blinkyBodies(options, frame)
  if (!bodies) return
  const { actor, victim, tool, hand, mouth } = bodies
  const grip = hand.getWorldPosition(new Vector3())
  const from = mouth.getWorldPosition(new Vector3()).sub(grip).normalize()
  const target = frame.powered ? victim.pelvis : victim.knees[0]
  const to = target.getWorldPosition(new Vector3()).sub(grip).normalize()
  const parent = hand.getWorldQuaternion(new Quaternion())
  const delta = parent
    .clone()
    .invert()
    .multiply(new Quaternion().setFromUnitVectors(from, to))
    .multiply(parent)
  tool.position.applyQuaternion(delta)
  tool.quaternion.premultiply(delta)
  tool.updateWorldMatrix(false, true)
  const rig = fightRigOf(actor)
  const support = tool.localToWorld(new Vector3(-0.08, 0.25, 0))
  reachLimb({ root: actor.arms[0], hinge: rig.elbows[0], end: rig.wrists[0] }, support)
}

function blinkyBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const actor = humanAnimationRig(own),
    victim = humanAnimationRig(rival)
  const equipment = blinkyTool(own)
  if (!actor || !victim || !equipment) return
  return { actor, victim, ...equipment }
}

function blinkyTool(own: import('three').Object3D) {
  const tool = own.getObjectByName('shizuku-blinky')
  const mouth = tool?.getObjectByName('open-mouth'),
    hand = tool?.parent
  return tool && mouth && hand ? { tool, mouth, hand } : undefined
}

import { Box3, Vector3 } from 'three'
import { humanAnimationRig, type AnimatedHuman } from '$lib/tour/humanAnimation'
import { fightRigOf } from '../fightRig'
import { throwPerformance } from './catalogue'
import { throwSmooth } from './sample'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'

type Bodies = { actor: AnimatedHuman; victim: AnimatedHuman }

export function throwGripWeight(frame: ThrowCinematicFrame): number {
  const t = frame.age / frame.duration
  return 1 - throwSmooth((t - (frame.powered ? 0.4 : 0.32)) / 0.16)
}

/** A held body stays within real arm reach; torso collision takes priority over the grip. */
export function coupleThrowGrip(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const performance = throwPerformance(frame.performance)
  if (!physicalHold(performance)) return
  const weight = throwGripWeight(frame),
    bodies = gripBodies(options, frame)
  if (weight <= 0 || !bodies) return
  const indices = performance?.grip === 'left' ? [0] : [0, 1]
  for (const index of indices)
    pullBody(bodies, { index, waist: performance?.grip === 'waist', weight })
  separateTorsos(bodies, frame.facing)
}

function physicalHold(performance: ReturnType<typeof throwPerformance>) {
  return (
    !['prop', 'scissors'].includes(performance?.grip ?? '') &&
    !['chain', 'gum', 'thread', 'blood', 'remote'].includes(performance?.effect ?? '')
  )
}
function gripBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame): Bodies | undefined {
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const actor = humanAnimationRig(own),
    victim = humanAnimationRig(rival)
  return actor && victim ? { actor, victim } : undefined
}
function pullBody(bodies: Bodies, grip: { index: number; waist: boolean; weight: number }) {
  const { actor, victim } = bodies,
    { index, waist, weight } = grip
  const rig = fightRigOf(actor),
    target = fightRigOf(victim)
  const joint = waist ? victim.pelvis : index === 0 ? target.wrists[1] : victim.torso
  const shoulder = actor.arms[index].getWorldPosition(new Vector3())
  const elbow = rig.elbows[index].getWorldPosition(new Vector3())
  const reach =
    (shoulder.distanceTo(elbow) +
      elbow.distanceTo(rig.wrists[index].getWorldPosition(new Vector3()))) *
    0.94
  const delta = joint.getWorldPosition(new Vector3()).sub(shoulder)
  const correction = Math.max(0, delta.length() - reach) * weight
  moveBody(victim, delta.normalize().multiplyScalar(-correction))
}
function separateTorsos(bodies: Bodies, facing: 1 | -1) {
  const own = new Box3().setFromObject(bodies.actor.torso),
    rival = new Box3().setFromObject(bodies.victim.torso)
  if (!own.intersectsBox(rival)) return
  const direction =
    Math.sign(rival.getCenter(new Vector3()).x - own.getCenter(new Vector3()).x) || facing
  const distance = direction > 0 ? own.max.x - rival.min.x : rival.max.x - own.min.x
  moveBody(bodies.victim, new Vector3((distance + 0.02) * direction, 0, 0))
}
function moveBody(human: AnimatedHuman, delta: Vector3) {
  const origin = human.figure.getWorldPosition(new Vector3()).add(delta)
  human.figure.position.copy(human.figure.parent!.worldToLocal(origin))
}

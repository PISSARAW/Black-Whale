import { Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf } from '../fightRig'
import { reachLimb } from '../fightLimbReach'
import { throwSmooth } from './sample'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'

/** The ninja's real feet close around the victim's shoulders without stretching either leg. */
export function alignThrowScissors(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const t = frame.age / frame.duration
  const weight = throwSmooth((t - 0.12) / 0.13) * (1 - throwSmooth((t - 0.5) / 0.18))
  if (weight <= 0) return
  const own = options.figureOf?.(frame.attacker), rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const human = humanAnimationRig(own), target = humanAnimationRig(rival)
  if (!human || !target) return
  const rig = fightRigOf(human)
  const centre = target.head.getWorldPosition(new Vector3())
  centre.y -= 0.2
  seatScissors(human, { centre, facing: frame.facing, weight })
  for (const index of [0, 1]) {
    const goal = centre.clone()
    goal.z += index === 0 ? -0.18 : 0.18
    reachLimb({ root: human.legs[index], hinge: human.knees[index], end: rig.ankles[index] }, goal, weight)
  }
}

function seatScissors(human: import('$lib/tour/humanAnimation').AnimatedHuman, options: {
  centre: Vector3; facing: 1 | -1; weight: number
}) {
  const hip = human.pelvis.getWorldPosition(new Vector3())
  const goal = options.centre.clone().add(new Vector3(-options.facing * 0.15, 0.16, 0))
  const delta = goal.sub(hip).clampLength(0, 1.4).multiplyScalar(options.weight)
  const origin = human.figure.getWorldPosition(new Vector3()).add(delta)
  human.figure.position.copy(human.figure.parent!.worldToLocal(origin))
  human.figure.updateWorldMatrix(false, true)
}

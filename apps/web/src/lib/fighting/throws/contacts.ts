import { Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { reachLimb } from '../fightLimbReach'
import { fightRigOf } from '../fightRig'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'
import { throwGripWeight } from './coupling'
import { throwPerformance } from './catalogue'

/** Both bodies are already posed; keep the gripping hand on the actual victim's anatomy. */
export function alignThrowGrip(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const bodies = throwBodies(options, frame)
  if (!bodies) return
  const { human, target } = bodies
  const weight = throwGripWeight(frame)
  if (weight <= 0) return
  const rig = fightRigOf(human)
  const indices = gripIndices(frame)
  for (const index of indices) {
    const waist = throwPerformance(frame.performance)?.grip === 'waist'
    const node = waist ? target.pelvis : index === 0 ? fightRigOf(target).wrists[1] : target.torso
    const goal = node.getWorldPosition(new Vector3())
    goal.z += (index === 0 ? -1 : 1) * 0.08
    reachLimb(
      { root: human.arms[index], hinge: rig.elbows[index], end: rig.wrists[index] },
      goal,
      weight,
    )
  }
}

function throwBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const human = humanAnimationRig(own),
    target = humanAnimationRig(rival)
  if (!human || !target) return
  return { human, target }
}

export function alignThrowPuppet(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!frame.puppetId || frame.age / frame.duration > 0.6) return
  const entity = activePuppet(state, frame)
  if (!entity) return
  const root = options.scene.getObjectByName(`prepared:${entity.id}`)
  const victim = options.figureOf?.(frame.victim)
  if (!root || !victim) return
  root.traverse((node) => {
    const human = humanAnimationRig(node)
    if (!human) return
    const rig = fightRigOf(human)
    const target = victim.getWorldPosition(new Vector3())
    target.y += 0.9
    reachLimb({ root: human.arms[1], hinge: rig.elbows[1], end: rig.wrists[1] }, target)
  })
}

function activePuppet(state: FightState, frame: ThrowCinematicFrame) {
  const entity = state.battlefield?.entities.find((entry) => entry.id === frame.puppetId)
  return entity?.present && entity.copy?.headAttached && entity.health > 0 ? entity : null
}

function gripIndices(frame: ThrowCinematicFrame) {
  if (frame.performance?.startsWith('chrollo')) return [0]
  return throwPerformance(frame.performance)?.grip === 'left' ? [0] : [0, 1]
}

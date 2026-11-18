import { Quaternion, Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf } from './fightRig'
import { reachLimb } from './fightLimbReach'
import type { ArcadeFighter } from './types'

interface Support {
  anchor: Vector3
  index: number
  frame: number
  age: number
  step?: Vector3
}

/** Scene-owned foot support survives Nen rebuilds and releases through an articulated catching step. */
export function createSeparationSupport() {
  let support: Support | undefined
  return (figure: Object3D, fighter: ArcadeFighter, timing: { frame: number; frozen: boolean }) => {
    const human = humanAnimationRig(figure)
    if (!human || !groundedSupport(fighter)) {
      support = undefined
      return
    }
    const rig = fightRigOf(human)
    const soles = rig.ankles.map((ankle) => ankle.getWorldPosition(new Vector3()))
    const index = soles[0].y <= soles[1].y ? 0 : 1
    if (!support || index !== support.index || timing.frame < support.frame)
      support = { anchor: soles[index].clone(), index, frame: timing.frame, age: 0 }
    const dt = timing.frozen ? 0 : Math.max(0, timing.frame - support.frame)
    support.frame = timing.frame
    const sole = soles[index]
    if (!support.step && support.anchor.distanceTo(sole) > 0.18) {
      support.step = sole.clone()
      support.age = 0
    }
    const target = supportTarget(support, dt)
    target.y = Math.max(target.y, sole.y)
    const ankle = rig.ankles[index]
    const flat = ankle.getWorldQuaternion(new Quaternion())
    reachLimb({ root: human.legs[index], hinge: human.knees[index], end: ankle }, target)
    ankle.quaternion.copy(
      ankle.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(flat),
    )
  }
}

function groundedSupport(fighter: ArcadeFighter): boolean {
  return (
    fighter.y <= 0 &&
    fighter.health > 0 &&
    !['down', 'ko', 'wakeup', 'walk'].includes(fighter.pose) &&
    !fighter.hanzoProjection &&
    !fighter.luiniPassage
  )
}

function supportTarget(support: Support, dt: number): Vector3 {
  if (!support.step) return support.anchor.clone()
  support.age += dt
  const p = Math.min(1, support.age / 9)
  const target = support.anchor.clone().lerp(support.step, p * p * (3 - 2 * p))
  target.y += Math.sin(Math.PI * p) * 0.055
  if (p === 1) {
    support.anchor.copy(support.step)
    support.step = undefined
  }
  return target
}

import type { Group, Object3D } from 'three'
import { humanAnimationRig, registerHumanAnimationRig } from './humanAnimation'

/** A projected body has its own joints; never constrain the original through a clone. */
export function registerHumanClone(
  source: Object3D,
  copies: ReadonlyMap<Object3D, Object3D>,
): void {
  const rig = humanAnimationRig(source) ?? humanAnimationRig(source.children[0])
  if (!rig) return
  const copy = <T extends Object3D>(node: T): T => {
    const found = copies.get(node)
    if (!found) throw new Error(`Missing cloned human joint: ${node.name}`)
    return found as T
  }
  registerHumanAnimationRig({
    pose: rig.pose,
    figure: copy<Group>(rig.figure),
    torso: copy(rig.torso),
    pelvis: copy(rig.pelvis),
    head: copy(rig.head),
    arms: rig.arms.map(copy),
    legs: rig.legs.map(copy),
    knees: rig.knees.map(copy),
  })
}

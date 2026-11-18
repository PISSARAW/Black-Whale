import { Vector3, type Object3D } from 'three'
import { constrainCombatJoint } from './fightAnatomy'
import { aimCombatChain } from './fightReachBasis'

export interface LimbChain {
  root: Object3D
  hinge: Object3D
  end: Object3D
}

/** A fixed-length two-bone chain with a stable bend plane and a one-axis hinge. */
export function reachLimb(chain: LimbChain, target: Vector3, weight = 1): number {
  if (weight <= 0) return error(chain, target)
  const oldRoot = chain.root.quaternion.clone(),
    oldHinge = chain.hinge.quaternion.clone()
  const origin = chain.root.getWorldPosition(new Vector3())
  const pivot = chain.hinge.getWorldPosition(new Vector3())
  const tip = chain.end.getWorldPosition(new Vector3())
  const lengths = { upper: origin.distanceTo(pivot), lower: pivot.distanceTo(tip) }
  if (Math.min(lengths.upper, lengths.lower) < 1e-5) return error(chain, target)
  solveHinge(chain, lengths, origin.distanceTo(target))
  orientChain(chain, { origin, target })
  const amount = Math.min(1, Math.max(0, weight))
  chain.root.quaternion.copy(oldRoot.slerp(chain.root.quaternion, amount))
  chain.hinge.quaternion.copy(oldHinge.slerp(chain.hinge.quaternion, amount))
  const knee = chain.hinge.name.startsWith('knee')
  constrainCombatJoint(chain.root, knee ? 'hip' : 'shoulder')
  constrainCombatJoint(chain.hinge, knee ? 'knee' : 'elbow')
  chain.root.updateWorldMatrix(false, true)
  return error(chain, target)
}
function solveHinge(
  chain: LimbChain,
  length: { upper: number; lower: number },
  distance: number,
): void {
  const { upper: a, lower: b } = length
  const reach = Math.min(a + b - 0.001, Math.max(Math.abs(a - b) + 0.001, distance))
  const angle = Math.acos(Math.max(-1, Math.min(1, (reach * reach - a * a - b * b) / (2 * a * b))))
  const sign = chain.hinge.name.startsWith('knee') ? 1 : -1
  const shoe =
    chain.end.parent === chain.hinge ? Math.atan2(-chain.end.position.z, -chain.end.position.y) : 0
  chain.hinge.rotation.set(sign * angle - shoe, 0, 0)
  constrainCombatJoint(chain.hinge, sign === 1 ? 'knee' : 'elbow')
  chain.root.updateWorldMatrix(false, true)
}
function orientChain(chain: LimbChain, input: { origin: Vector3; target: Vector3 }): void {
  const { origin, target } = input
  const axis = chain.end.getWorldPosition(new Vector3()).sub(origin)
  const direction = target.clone().sub(origin)
  aimCombatChain(chain.root, axis, direction)
}
function error(chain: LimbChain, target: Vector3): number {
  return chain.end.getWorldPosition(new Vector3()).distanceTo(target)
}

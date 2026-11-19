import { Quaternion, Vector3, type Object3D } from 'three'

/** Minimum rotation preserves the authored bend plane, including near full extension. */
export function aimCombatChain(root: Object3D, from: Vector3, to: Vector3): void {
  if (from.lengthSq() < 1e-8 || to.lengthSq() < 1e-8) return
  const turn = new Quaternion().setFromUnitVectors(from.normalize(), to.normalize())
  const parent = root.parent!.getWorldQuaternion(new Quaternion())
  turn.premultiply(parent.clone().invert()).multiply(parent)
  root.quaternion.premultiply(turn)
  root.updateWorldMatrix(false, true)
}

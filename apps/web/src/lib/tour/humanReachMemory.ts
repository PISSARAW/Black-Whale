import type { Object3D, Quaternion } from 'three'

const PREVIOUS = new WeakMap<Object3D, Quaternion>()

/** Preserve the last displayed branch before animation resets a joint to its authored pose. */
export function rememberHumanReach(joint: Object3D): void {
  PREVIOUS.set(joint, joint.quaternion.clone())
}

export function humanReachReference(joint: Object3D): Quaternion | undefined {
  return PREVIOUS.get(joint)
}

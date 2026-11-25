import type { Object3D } from 'three'
import { EXTREMITY_QUALITY_TARGET } from './humanExtremityBudget'
import { humanFootRig } from './humanFootRig'
import { humanHandRig } from './humanHandRig'

const DETAIL = new WeakMap<Object3D, boolean>()

/** Switch close articulated extremities without rebuilding geometry or allocating frame state. */
export function setHumanExtremityLod(root: Object3D, distance: number): void {
  const detailed = distance <= EXTREMITY_QUALITY_TARGET.nearDistance
  if (DETAIL.get(root) === detailed) return
  DETAIL.set(root, detailed)
  for (const side of ['left', 'right'] as const) {
    const hand = root.getObjectByName(`hand-${side}`)
    if (hand) humanHandRig(hand)?.setDetailed(detailed)
    const foot = root.getObjectByName(`foot-${side}`)
    if (foot) humanFootRig(foot)?.setDetailed(detailed)
  }
}

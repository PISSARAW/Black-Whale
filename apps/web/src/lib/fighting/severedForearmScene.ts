import type { Group } from 'three'
import { forearmNode, type SeveredForearm } from './severedForearms'

/** The actual shared human forearm keeps its elbow, hand, proportions and skin. */
export function poseDetachedForearm(root: Group, part?: SeveredForearm): void {
  if (!part) return
  const limb = root.getObjectByName(forearmNode(part))
  if (!limb) return
  limb.removeFromParent()
  // Retain cached geometry ownership and the human hierarchy, but show only this real limb.
  for (const child of root.children) child.visible = false
  root.add(limb)
  limb.position.set(0, 0.12, 0)
  limb.rotation.set(0, 0, Math.PI / 2)
}

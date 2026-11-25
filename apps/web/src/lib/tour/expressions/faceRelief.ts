import type { Object3D } from 'three'
import type { ExpressionPose } from './types'

interface ReliefPart {
  node: Object3D
  y: number
  sy: number
  sx: number
  kind: 'nose' | 'cheek'
}
const PARTS = new WeakMap<Object3D, ReliefPart[]>()
/** Move existing anatomical relief, including the native Melody cheeks. */
export function drawFaceRelief(head: Object3D, pose: ExpressionPose): void {
  let parts = PARTS.get(head)
  if (!parts) {
    parts = []
    for (const name of ['face-nose', 'face-relief', 'melody-cheek-left', 'melody-cheek-right']) {
      const node = head.getObjectByName(name)
      if (node)
        parts.push({
          node,
          y: node.position.y,
          sx: node.scale.x,
          sy: node.scale.y,
          kind: name.includes('cheek') ? 'cheek' : 'nose',
        })
    }
    PARTS.set(head, parts)
  }
  for (const part of parts) {
    const nose = part.kind === 'nose'
    part.node.position.y = part.y + (nose ? pose.noseWrinkle * 0.004 : pose.cheekRaise * 0.005)
    part.node.scale.x = part.sx * (1 + (nose ? pose.nostrilFlare * 0.12 : pose.cheekRaise * 0.04))
    part.node.scale.y = part.sy * (1 - (nose ? pose.noseWrinkle * 0.08 : pose.cheekRaise * 0.08))
  }
}

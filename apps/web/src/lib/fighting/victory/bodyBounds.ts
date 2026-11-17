import { Box3, Mesh } from 'three'
import type { Object3D } from 'three'

/** Ignore hidden aura shells when fitting a physical body or a paw contact. */
export function visibleVictoryBounds(root: Object3D) {
  root.updateWorldMatrix(true, true)
  const bounds = new Box3()
  const expand = (node: Object3D) => {
    if (!node.visible) return
    if (node instanceof Mesh) {
      node.geometry.computeBoundingBox()
      if (node.geometry.boundingBox)
        bounds.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld))
    }
    node.children.forEach(expand)
  }
  expand(root)
  return bounds
}

import { Box3, Mesh, Vector3 } from 'three'
import type { Object3D } from 'three'

/** Bounds of only the vertices belonging to each visible section; never include a ground shadow. */
export function nobunagaCutBounds(source: Object3D, height: number) {
  const bounds = [new Box3(), new Box3()]
  const point = new Vector3()
  function visit(node: Object3D) {
    if (!node.visible || node.name === 'contact-shadow') return
    if (node instanceof Mesh) {
      const positions = node.geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld)
        bounds[point.y >= height ? 1 : 0].expandByPoint(point)
      }
    }
    node.children.forEach(visit)
  }
  source.updateWorldMatrix(true, true)
  visit(source)
  return bounds
}

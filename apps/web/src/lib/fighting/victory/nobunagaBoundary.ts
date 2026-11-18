import { Box3, Mesh, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { NobunagaContext } from './nobunagaTypes'
import { NOBUNAGA_EN_RADIUS } from './nobunagaTypes'

/** First physical surface to touch En. Ground shadows and hidden aura are not bodies. */
export function placeAtNobunagaBoundary(
  context: NobunagaContext,
  centre: Vector3,
  advance: number,
) {
  const { victim } = context
  victim.root.updateWorldMatrix(true, true)
  let shift = -Infinity
  const point = new Vector3()
  function examine(node: Object3D) {
    if (!node.visible || node.name === 'contact-shadow' || node.name.startsWith('nen-')) return
    if (node instanceof Mesh) {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox()
      const box = new Box3().copy(node.geometry.boundingBox!).applyMatrix4(node.matrixWorld)
      const y = Math.max(box.min.y, Math.min(box.max.y, centre.y))
      const z = Math.max(box.min.z, Math.min(box.max.z, centre.z))
      const cross = NOBUNAGA_EN_RADIUS ** 2 - (y - centre.y) ** 2 - (z - centre.z) ** 2
      if (cross > 0) {
        const needed = centre.x + Math.sqrt(cross) - box.min.x
        if (needed > shift) {
          shift = needed
          point.set(box.min.x, y, z)
        }
      }
    }
    node.children.forEach(examine)
  }
  examine(victim.root)
  const offset = shift + (1 - advance) * 0.9
  victim.root.position.x += offset
  point.x += offset
  victim.root.updateWorldMatrix(true, true)
  return point
}

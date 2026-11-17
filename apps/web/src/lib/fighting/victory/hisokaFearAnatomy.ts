import * as THREE from 'three'
import type { VictoryContext } from './types'

/** The smile pulls the cheeks and jaw as one surface, rather than floating over the skin. */
export function deformHisokaFearPoint(point: THREE.Vector3, expression: number) {
  const lower = THREE.MathUtils.smoothstep(-point.y, 0.025, 0.17)
  const cheek = Math.exp(-Math.pow((point.y + 0.035) / 0.075, 2))
  point.x *= 1 + expression * (lower * 0.12 - cheek * 0.05)
  point.y -= expression * lower * 0.035
  point.z += expression * lower * 0.065 * Math.max(0, Math.min(1, point.z / 0.045))
  return point
}
export function createHisokaFearAnatomy(head: THREE.Object3D) {
  const face = head.getObjectByName('manga-face')!
  const parts = face.children
    .filter((node): node is THREE.Mesh => node instanceof THREE.Mesh)
    .map((mesh) => ({
      mesh,
      geometry: mesh.geometry.clone(),
      neutral: mesh.geometry.attributes.position.clone(),
    }))
  return {
    apply(context: VictoryContext, expression: number) {
      for (const { mesh, geometry, neutral } of parts) {
        const original = mesh.geometry,
          positions = geometry.attributes.position
        for (let i = 0; i < positions.count; i++) {
          const p = deformHisokaFearPoint(
            new THREE.Vector3(neutral.getX(i), neutral.getY(i), neutral.getZ(i)),
            expression,
          )
          positions.setXYZ(i, p.x, p.y, p.z)
        }
        positions.needsUpdate = true
        geometry.computeVertexNormals()
        geometry.computeBoundingSphere()
        mesh.geometry = geometry
        context.defer(() => {
          mesh.geometry = original
        })
      }
    },
    dispose() {
      parts.forEach((part) => part.geometry.dispose())
    },
  }
}

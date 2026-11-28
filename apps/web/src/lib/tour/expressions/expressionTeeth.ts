import type { Mesh, MeshBasicMaterial } from 'three'
import type { ExpressionFaceRig } from './faceRig'
import type { ExpressionPose } from './types'

const TEETH = new WeakMap<Mesh, Mesh>()
/** Optional teeth remain inside the existing lip mesh, including its jaw transform. */
export function drawCatalogueTeeth(rig: ExpressionFaceRig, pose: ExpressionPose): void {
  const mouth = rig.mouth
  if (!mouth || mouth.userData.expressionTeeth) return
  let teeth = TEETH.get(mouth)
  if (!teeth && pose.teeth <= 0) return
  if (!teeth) {
    const { THREE } = rig
    mouth.geometry.computeBoundingBox()
    const box = mouth.geometry.boundingBox!
    const centre = box.getCenter(new THREE.Vector3())
    teeth = new THREE.Mesh(
      new THREE.PlaneGeometry(
        (box.max.x - box.min.x) * 0.75,
        Math.max(0.002, (box.max.y - box.min.y) * 0.4),
      ),
      new THREE.MeshBasicMaterial({ color: 0xeee7d9, side: THREE.DoubleSide }),
    )
    teeth.name = 'expression-visible-teeth'
    teeth.position.copy(centre)
    teeth.position.z += 0.001
    mouth.add(teeth)
    TEETH.set(mouth, teeth)
  }
  teeth.visible = pose.teeth > 0.01
  teeth.scale.x = 0.75 + pose.teeth * 0.25
}
export function suspendCatalogueTeeth(mouth: Mesh | undefined): () => void {
  const teeth = mouth && TEETH.get(mouth)
  if (!teeth) return () => {}
  const visible = teeth.visible
  teeth.visible = false
  return () => {
    teeth.visible = visible
  }
}
export function disposeCatalogueTeeth(mouth: Mesh) {
  const teeth = TEETH.get(mouth)
  if (!teeth) return
  teeth.geometry.dispose()
  ;(teeth.material as MeshBasicMaterial).dispose()
  teeth.removeFromParent()
  TEETH.delete(mouth)
}

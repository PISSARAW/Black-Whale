import { Quaternion, Vector3, type Mesh, type Object3D } from 'three'

const SURFACES = new WeakMap<Object3D, Mesh[]>()
export const FOOT_CLEARANCE = 0.006

/** Normal transforms include the scaled thigh; quaternion decomposition alone loses that shear. */
export function levelFightFoot(ankle: Object3D): void {
  if (!ankle.parent) return
  ankle.parent.updateWorldMatrix(true, false)
  const m = ankle.parent.matrixWorld.elements
  const up = new Vector3(0, 1, 0).applyQuaternion(ankle.quaternion)
  const normal = new Vector3(m[1], m[5], m[9]).normalize()
  ankle.quaternion.premultiply(new Quaternion().setFromUnitVectors(up, normal))
}

/** Shoe geometry only: ankle origins are above the sole and cannot define the floor. */
export function lowestFootHeight(ankle: Object3D): number {
  let meshes = SURFACES.get(ankle)
  if (!meshes) {
    meshes = []
    ankle.traverse((node) => {
      if ((node as Mesh).isMesh) meshes!.push(node as Mesh)
    })
    SURFACES.set(ankle, meshes)
  }
  let lowest = Infinity
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false)
    const vertices = mesh.geometry.getAttribute('position'),
      m = mesh.matrixWorld.elements
    for (let i = 0; i < vertices.count; i++)
      lowest = Math.min(
        lowest,
        m[1] * vertices.getX(i) + m[5] * vertices.getY(i) + m[9] * vertices.getZ(i) + m[13],
      )
  }
  return lowest
}

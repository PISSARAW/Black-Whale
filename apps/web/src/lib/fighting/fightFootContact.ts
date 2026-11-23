import { Quaternion, Vector3, type BufferGeometry, type Mesh, type Object3D } from 'three'

const SURFACES = new WeakMap<Object3D, Mesh[]>()
const POSITIONS = new WeakMap<BufferGeometry, Float64Array>()
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
  ankle.updateWorldMatrix(true, true)
  for (const mesh of meshes) {
    const positions = footPositions(mesh.geometry)
    const m = mesh.matrixWorld.elements
    const x = m[1],
      y = m[5],
      z = m[9],
      offset = m[13]
    for (let i = 0; i < positions.length; i += 3) {
      const height = x * positions[i] + y * positions[i + 1] + z * positions[i + 2] + offset
      if (height < lowest) lowest = height
    }
  }
  return lowest
}

/** Shoes use static geometry. Read buffer attributes once and retain the exact vertex values. */
function footPositions(geometry: BufferGeometry) {
  const cached = POSITIONS.get(geometry)
  if (cached) return cached
  const vertices = geometry.getAttribute('position')
  const positions = new Float64Array(vertices.count * 3)
  for (let i = 0; i < vertices.count; i++) {
    positions[i * 3] = vertices.getX(i)
    positions[i * 3 + 1] = vertices.getY(i)
    positions[i * 3 + 2] = vertices.getZ(i)
  }
  POSITIONS.set(geometry, positions)
  return positions
}

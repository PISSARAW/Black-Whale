import type * as Three from 'three'
import { DETAIL_TAGS_KEY, detailTagRangesOf } from '$lib/tour/detailTag'

/** Remove only triangles wholly discarded by every intersection clipping plane.
 * Straddling surfaces still use the original GPU clip, including their exact edges.
 */
export function pruneStaticRoomCut(THREE: typeof Three, root: Three.Object3D) {
  root.updateMatrixWorld(true)
  root.traverse((node) => {
    const mesh = node as Three.Mesh
    if (!mesh.isMesh || Array.isArray(mesh.material)) return
    const material = mesh.material
    if (!material.clipIntersection || !material.clippingPlanes?.length) return
    if (material.alphaToCoverage || material.transparent) return
    pruneMesh(THREE, mesh)
  })
}

function pruneMesh(THREE: typeof Three, mesh: Three.Mesh) {
  const geometry = mesh.geometry
  const positions = geometry.attributes.position
  if (positions.count < 1000 || geometry.groups.length) return
  const material = mesh.material as Three.Material
  const planes = material.clippingPlanes!.map((plane) =>
    plane.clone().applyMatrix4(mesh.matrixWorld.clone().invert()),
  )
  const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const kept: number[] = []
  const faces: number[] = []
  const total = geometry.index?.count ?? positions.count
  for (let index = 0; index < total; index += 3) {
    const indices = [0, 1, 2].map(
      (offset) => geometry.index?.getX(index + offset) ?? index + offset,
    )
    indices.forEach((vertex, offset) => vertices[offset].fromBufferAttribute(positions, vertex))
    const clipped = planes.every((plane) =>
      vertices.every((vertex) => plane.distanceToPoint(vertex) < -1e-6),
    )
    if (!clipped) {
      kept.push(...indices)
      faces.push(index / 3)
    }
  }
  if (kept.length === total) return
  geometry.setIndex(kept)
  geometry.userData.fightStaticCut = { before: total / 3, after: kept.length / 3 }
  remapStaticDetailTags(mesh, faces)
}

export function remapStaticDetailTags(mesh: Three.Mesh, faces: number[]) {
  const ranges = detailTagRangesOf(mesh)
  if (!ranges.length) return
  let cursor = 0
  mesh.userData[DETAIL_TAGS_KEY] = ranges.flatMap((range) => {
    while (cursor < faces.length && faces[cursor] < range.start) cursor++
    const start = cursor
    while (cursor < faces.length && faces[cursor] < range.start + range.count) cursor++
    return cursor > start ? [{ ...range, start, count: cursor - start }] : []
  })
}

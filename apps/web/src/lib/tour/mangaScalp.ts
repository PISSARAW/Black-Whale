import type { BufferGeometry } from 'three'
import type { Three } from './silentMajorityParts'

/** A scalp follows the actual skull, so angular foreheads cannot pierce a spherical cap. */
export function mangaScalpGeometry(kit: { THREE: Three; face?: BufferGeometry }): BufferGeometry {
  if (!kit.face)
    return new kit.THREE.SphereGeometry(0.2, 24, 14, 0, Math.PI * 2, 0, 1.2).translate(0, 0.04, 0)
  const scalp = kit.face.clone()
  scalp.deleteAttribute('color')
  const positions = scalp.getAttribute('position')
  const source = scalp.index!
  const triangles = []
  for (let i = 0; i < source.count; i += 3) {
    const a = source.getX(i),
      b = source.getX(i + 1),
      c = source.getX(i + 2)
    if (Math.min(positions.getY(a), positions.getY(b), positions.getY(c)) >= 0.09)
      triangles.push(a, b, c)
  }
  scalp.setIndex(triangles)
  for (let i = 0; i < positions.count; i++) {
    positions.setXYZ(
      i,
      positions.getX(i) * 1.055,
      positions.getY(i) + 0.012,
      positions.getZ(i) * 1.065,
    )
  }
  scalp.computeVertexNormals()
  return scalp
}

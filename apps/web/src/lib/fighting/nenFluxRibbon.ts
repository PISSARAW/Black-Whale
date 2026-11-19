import { Vector3, type BufferGeometry, type Mesh, type Object3D } from 'three'

type Three = typeof import('three')
const SEGMENTS = 12

export function fluxRibbonGeometry(THREE: Three): BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array((SEGMENTS + 1) * 6), 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  )
  const indices: number[] = []
  for (let n = 0; n < SEGMENTS; n++) {
    const a = n * 2
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  geometry.setIndex(indices)
  return geometry
}

/** A connected, tapering ribbon advances at constant distance through the actual posed joints. */
export function drawFluxRibbon(mesh: Mesh, path: Object3D[], head: number): void {
  const points = path.map((part) => part.getWorldPosition(new Vector3()))
  const length = points.slice(1).reduce((sum, point, i) => sum + point.distanceTo(points[i]), 0)
  if (length < 1e-5) {
    mesh.visible = false
    return
  }
  const origin = fluxPathPoint(points, head)
  mesh.position.copy(origin)
  mesh.position.z += 0.07
  mesh.frustumCulled = false
  mesh.visible = true
  const vertices = mesh.geometry.getAttribute('position')
  const tail = Math.max(0, head - 0.38)
  for (let n = 0; n <= SEGMENTS; n++) {
    const u = n / SEGMENTS,
      t = tail + (head - tail) * u
    const centre = fluxPathPoint(points, t).sub(origin)
    const tangent = fluxPathPoint(points, Math.min(1, t + 0.015)).sub(
      fluxPathPoint(points, Math.max(0, t - 0.015)),
    )
    const width = 0.022 * Math.sin(Math.PI * u) ** 0.6
    const normal = new Vector3(-tangent.y, tangent.x, 0).normalize().multiplyScalar(width)
    vertices.setXYZ(n * 2, centre.x + normal.x, centre.y + normal.y, centre.z)
    vertices.setXYZ(n * 2 + 1, centre.x - normal.x, centre.y - normal.y, centre.z)
  }
  vertices.needsUpdate = true
}

export function fluxPathPoint(points: Vector3[], progress: number): Vector3 {
  const lengths = points.slice(1).map((point, i) => point.distanceTo(points[i]))
  let remaining = Math.min(1, Math.max(0, progress)) * lengths.reduce((sum, n) => sum + n, 0)
  for (let n = 0; n < lengths.length; n++) {
    if (remaining <= lengths[n])
      return points[n].clone().lerp(points[n + 1], remaining / Math.max(1e-6, lengths[n]))
    remaining -= lengths[n]
  }
  return points.at(-1)!.clone()
}

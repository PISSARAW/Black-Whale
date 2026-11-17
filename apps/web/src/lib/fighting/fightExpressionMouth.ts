import type { BufferGeometry, Mesh, Object3D } from 'three'
import type { HumanFigureBuild } from '$lib/tour/humanFigure'

type Three = HumanFigureBuild['THREE']
const CACHE = new Map<string, BufferGeometry>()

/** Three shared GPU morphs on the existing mouth: no additional meshes or draw calls. */
export function prepareExpressionMouth(options: { THREE: Three; mouth: Mesh; head: Object3D }) {
  const { THREE, mouth, head } = options
  const key = `${head.name}:${mouth.geometry.uuid}`
  let geometry = CACHE.get(key)
  if (!geometry) {
    geometry = mouthRibbon(THREE, mouth.geometry)
    geometry.userData.sharedHuman = true
    geometry.morphTargetsRelative = true
    geometry.morphAttributes.position = [0, 1, 2].map((kind) =>
      mouthTarget({ THREE, mouth, head, geometry: geometry! }, kind),
    )
    geometry.computeBoundingSphere()
    CACHE.set(key, geometry)
  }
  mouth.geometry = geometry
  mouth.updateMorphTargets()
}

function mouthTarget(
  options: { THREE: Three; mouth: Mesh; head: Object3D; geometry: BufferGeometry },
  kind: number,
) {
  const { THREE, mouth, head, geometry } = options
  const source = geometry.getAttribute('position')
  const positions = new Float32Array(source.count * 3)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const centre = box.getCenter(new THREE.Vector3())
  const halfWidth = Math.max(0.001, (box.max.x - box.min.x) / 2)
  const face = head.getObjectByName('manga-face') ?? head.getObjectByName('kurapika-face')
  const ray = new THREE.Raycaster()
  head.updateWorldMatrix(true, true)
  for (let i = 0; i < source.count; i++) {
    const edge = (source.getX(i) - centre.x) / halfWidth
    const middle = 1 - Math.abs(edge)
    const upper = i % 2 === 0 ? 1 : -1
    const x = source.getX(i) + edge * (kind === 1 ? 0.005 : 0.002)
    const opening = kind === 0 ? 0.006 : 0.014
    const y =
      source.getY(i) +
      (kind === 2
        ? (edge * edge - 0.4) * 0.012
        : upper * Math.sin((middle * Math.PI) / 2) * opening)
    const point = new THREE.Vector3(x, y, source.getZ(i))
    if (face) projectMouthPoint({ mouth, face, ray }, point)
    positions[i * 3] = point.x - source.getX(i)
    positions[i * 3 + 1] = point.y - source.getY(i)
    positions[i * 3 + 2] = point.z - source.getZ(i)
  }
  return new THREE.Float32BufferAttribute(positions, 3)
}

/** Preserve the authored outline while giving the lips enough vertices to curve. */
function mouthRibbon(THREE: Three, original: BufferGeometry) {
  const source = original.getAttribute('position')
  const points = Array.from({ length: source.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(source, i),
  )
  const min = Math.min(...points.map((p) => p.x)),
    max = Math.max(...points.map((p) => p.x))
  const columns = [
    ...new Set([
      ...points.map((p) => p.x),
      ...Array.from({ length: 25 }, (_, i) => min + ((max - min) * i) / 24),
    ]),
  ].sort((a, b) => a - b)
  const positions: number[] = [],
    indices: number[] = []
  columns.forEach((x, index) => {
    const intersections = polygonColumn(points, x)
    for (const point of [intersections.at(-1)!, intersections[0]])
      positions.push(x, point.y, point.z)
    if (index > 0) {
      const a = (index - 1) * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function polygonColumn(points: import('three').Vector3[], x: number) {
  const intersections: import('three').Vector3[] = []
  points.forEach((a, index) => {
    const b = points[(index + 1) % points.length]
    if (Math.abs(b.x - a.x) < 1e-8) return
    const t = (x - a.x) / (b.x - a.x)
    if (t >= -1e-6 && t <= 1 + 1e-6)
      intersections.push(a.clone().lerp(b, Math.max(0, Math.min(1, t))))
  })
  return intersections.sort((a, b) => a.y - b.y)
}

/** Fitted once at construction, including Kurapika's curved lower face. */
function projectMouthPoint(
  options: { mouth: Mesh; face: Object3D; ray: import('three').Raycaster },
  point: import('three').Vector3,
) {
  const { mouth, face, ray } = options
  const origin = mouth.localToWorld(point.clone().setZ(1))
  const direction = mouth.localToWorld(point.clone().setZ(-1)).sub(origin).normalize()
  ray.set(origin, direction)
  const contact = ray.intersectObject(face, true)[0]
  if (contact) point.z = mouth.worldToLocal(contact.point).z + 0.0018
}

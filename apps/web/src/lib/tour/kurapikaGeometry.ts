import type { Three } from './silentMajorityParts'

export type Point3 = readonly [number, number, number]

/** A tailored panel follows the chest in depth instead of floating in front of it. */
export function kurapikaPanel(THREE: Three, points: readonly Point3[]) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      points.flatMap((p) => [...p]),
      3,
    ),
  )
  const contour = points.map(([x, y]) => new THREE.Vector2(x, y))
  geometry.setIndex(THREE.ShapeUtils.triangulateShape(contour, []).flat())
  geometry.computeVertexNormals()
  return geometry
}

/** Elliptical sections give the cheeks a flat front and a small, pointed chin. */
export function kurapikaFaceGeometry(THREE: Three) {
  const sections = [
    [0.006, -0.187],
    [0.047, -0.163],
    [0.092, -0.12],
    [0.128, -0.067],
    [0.147, 0],
    [0.15, 0.079],
    [0.129, 0.15],
    [0.081, 0.195],
    [0, 0.213],
  ]
  const geometry = new THREE.LatheGeometry(
    sections.map(([x, y]) => new THREE.Vector2(x, y)),
    32,
  )
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const z = position.getZ(i)
    // A broad facial plane keeps both eyes on the skin even at three quarters.
    const front = z > 0 ? Math.min(z * 0.88, 0.119) : z * 0.82
    position.setZ(i, front)
  }
  geometry.computeVertexNormals()
  return geometry
}

export interface HairLock {
  points: readonly Point3[]
  width: number
  depth: number
}

/** A tapered solid lock; the triangular end remains a silhouette from the side. */
export function kurapikaLock(THREE: Three, lock: HairLock) {
  const curve = new THREE.CatmullRomCurve3(lock.points.map((point) => new THREE.Vector3(...point)))
  const positions: number[] = []
  const uv: number[] = []
  const indices: number[] = []
  const steps = 12
  const sides = 6
  for (let step = 0; step <= steps; step++) {
    const t = step / steps
    const center = curve.getPoint(t)
    const tangent = curve.getTangent(t)
    const normal = new THREE.Vector3(center.x * 0.65, 0.1, Math.max(0.06, center.z)).normalize()
    const across = tangent.clone().cross(normal).normalize()
    const out = across.clone().cross(tangent).normalize()
    const taper = Math.max(0.012, (1 - t ** 2.4) * (0.75 + Math.sin(t * Math.PI) * 0.25))
    for (let side = 0; side <= sides; side++) {
      const angle = (side / sides) * Math.PI * 2
      const vertex = center
        .clone()
        .addScaledVector(across, Math.cos(angle) * lock.width * taper)
        .addScaledVector(out, Math.sin(angle) * lock.depth * taper)
      positions.push(vertex.x, vertex.y, vertex.z)
      uv.push(side / sides, t)
      if (step < steps && side < sides) {
        const a = step * (sides + 1) + side
        const b = a + 1
        const c = a + sides + 1
        indices.push(a, c, b, b, c, c + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Subdivide before projecting: a single flat triangle would cut through the jacket. */
export function kurapikaSurfacePanel(
  THREE: Three,
  options: {
    points: readonly Point3[]
    depth: (x: number, y: number) => number
  },
) {
  const flat = kurapikaPanel(THREE, options.points)
  const positions = flat.getAttribute('position')
  const indices = flat.index!
  const vertices: number[] = []
  const divisions = 8
  for (let triangle = 0; triangle < indices.count; triangle += 3) {
    const corners = [0, 1, 2].map(
      (offset) =>
        new THREE.Vector2(
          positions.getX(indices.getX(triangle + offset)),
          positions.getY(indices.getX(triangle + offset)),
        ),
    )
    const sample = (i: number, j: number) => {
      const x =
        corners[0].x +
        ((corners[1].x - corners[0].x) * i) / divisions +
        ((corners[2].x - corners[0].x) * j) / divisions
      const y =
        corners[0].y +
        ((corners[1].y - corners[0].y) * i) / divisions +
        ((corners[2].y - corners[0].y) * j) / divisions
      return [x, y, options.depth(x, y)]
    }
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions - i; j++) {
        vertices.push(...sample(i, j), ...sample(i + 1, j), ...sample(i, j + 1))
        if (i + j < divisions - 1)
          vertices.push(...sample(i + 1, j), ...sample(i + 1, j + 1), ...sample(i, j + 1))
      }
    }
  }
  flat.dispose()
  const result = new THREE.BufferGeometry()
  result.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  result.computeVertexNormals()
  return result
}

export function kurapikaShoeGeometry(THREE: Three) {
  const plan = new THREE.Shape()
  plan.moveTo(-0.043, -0.092)
  plan.lineTo(0.043, -0.092)
  plan.lineTo(0.046, 0.035)
  plan.quadraticCurveTo(0.043, 0.12, 0.018, 0.157)
  plan.quadraticCurveTo(0, 0.17, -0.018, 0.157)
  plan.quadraticCurveTo(-0.043, 0.12, -0.046, 0.035)
  plan.closePath()
  return new THREE.ExtrudeGeometry(plan, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSize: 0.007,
    bevelThickness: 0.01,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 8,
  })
    .rotateX(Math.PI / 2)
    .translate(0, 0.04, 0)
}

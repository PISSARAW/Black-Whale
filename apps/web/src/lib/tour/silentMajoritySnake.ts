import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit, type Point } from './nenModelPrimitives'

const BODY_PATH: Point[] = [
  [-0.8, 0.055, -0.15],
  [-0.55, 0.095, 0.39],
  [0.16, 0.125, 0.56],
  [0.62, 0.16, 0.13],
  [0.35, 0.22, -0.34],
  [-0.05, 0.35, -0.16],
  [-0.04, 0.68, 0],
  [0.015, 1.05, 0.09],
  [0.025, 1.28, 0.14],
]

function addBody({ THREE, glow, root }: BasicApparitionContext, size: number) {
  const path = new THREE.CatmullRomCurve3(
    BODY_PATH.map((point) => new THREE.Vector3(...point).multiplyScalar(size)),
  )
  const length = 48
  const sides = 10
  const body = new THREE.TubeGeometry(path, length, 0.18 * size, sides)
  const vertices = body.getAttribute('position')
  const tint: number[] = []
  const base = new THREE.Color(BONE)
  for (let ring = 0; ring <= length; ring++) {
    const progress = ring / length
    const centre = path.getPointAt(progress)
    const width = Math.min(1, 0.045 + 1.62 * progress)
    for (let side = 0; side <= sides; side++) {
      const index = ring * (sides + 1) + side
      const vertex = new THREE.Vector3().fromBufferAttribute(vertices, index)
      const normal = vertex.sub(centre).normalize()
      const tone = normal.z + normal.y * 0.65 > 0 ? 1 : 0.74
      tint.push(base.r * tone, base.g * tone, base.b * tone)
      vertex.fromBufferAttribute(vertices, index).lerp(centre, 1 - width)
      vertices.setXYZ(index, vertex.x, Math.max(0, vertex.y), vertex.z)
    }
  }
  body.setAttribute('color', new THREE.Float32BufferAttribute(tint, 3))
  body.computeVertexNormals()
  const material = glow(0xffffff, 1).clone()
  material.vertexColors = true
  const mesh = new THREE.Mesh(body, material)
  mesh.name = 'tsuchibokko-coil'
  root.add(mesh)
}

type Kit = ReturnType<typeof modelKit>

function addMouth(kit: Kit, index: number, y: number) {
  const isHead = index === 0
  const x = isHead ? 0.025 : 0
  const z = isHead ? 0.32 : 0.3 - (index - 1) * 0.032
  const width = isHead ? 0.151 : 0.11 - index * 0.004
  const height = isHead ? 0.071 : 0.037 - index * 0.002
  kit.oval({
    name: `tsuchibokko-mouth-${index}`,
    at: [x, y, z],
    radii: [width, height, 0.024],
    colour: INK,
  })
  for (const lip of [-1, 1]) {
    kit.tube({
      name: `tsuchibokko-lip-${index}-${lip}`,
      points: [
        [x - width, y, z],
        [x - width * 0.42, y + lip * height * 0.83, z + 0.021],
        [x + width * 0.42, y + lip * height * 0.83, z + 0.021],
        [x + width, y, z],
      ],
      radius: isHead ? 0.022 : 0.013,
      colour: 0xb39a89,
    })
  }
}

/** The rearing white tsuchibokko carries mouths down the front of its body (ch. 370). */
export function buildTsuchibokko(seen: Apparition, context: BasicApparitionContext) {
  addBody(context, seen.size)
  const k = modelKit(context, seen.size)
  k.oval({
    name: 'tsuchibokko-head',
    at: [0.025, 1.29, 0.155],
    radii: [0.23, 0.23, 0.19],
    colour: BONE,
  })
  for (const side of [-1, 1]) {
    const x = 0.025 + side * 0.107
    k.oval({
      name: `tsuchibokko-eye-${side}`,
      at: [x, 1.349, 0.315],
      radii: [0.042, 0.055, 0.019],
      colour: INK,
    }).rotation.z = side * 0.28
    k.oval({
      name: `tsuchibokko-eye-glint-${side}`,
      at: [x - 0.01, 1.367, 0.334],
      radii: [0.009, 0.012, 0.003],
      colour: BONE,
    })
  }
  ;[1.215, 1.03, 0.891, 0.752, 0.613].forEach((y, index) => addMouth(k, index, y))
  return context.root
}

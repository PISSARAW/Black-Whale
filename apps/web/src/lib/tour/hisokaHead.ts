import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { addMangaEyes } from './mangaEyes'
import { addMangaFaceTraits } from './mangaFaceTraits'
import { mangaLikeness } from './mangaLikeness'
import { addHisokaHair } from './hisokaHair'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'

type Three = HumanHeadBuild['THREE']

// Horizontal sections, from chin to crown: height, half-width, front and back.
// The front profile is independent of the width to give the jaw a real profile.
const FACE_SECTIONS = [
  [-0.204, 0, 0.072, 0.072],
  [-0.194, 0.036, 0.126, 0.016],
  [-0.168, 0.074, 0.148, -0.035],
  [-0.129, 0.108, 0.161, -0.082],
  [-0.08, 0.128, 0.163, -0.121],
  [-0.034, 0.146, 0.166, -0.143],
  [0.01, 0.148, 0.168, -0.151],
  [0.054, 0.144, 0.17, -0.153],
  [0.105, 0.141, 0.165, -0.148],
  [0.153, 0.124, 0.137, -0.126],
  [0.19, 0.086, 0.089, -0.093],
  [0.216, 0, -0.008, -0.008],
] as const

const faceFrontPower = (y: number) => (y < 0.06 ? 0.42 : 0.6)

function facialPlanes(x: number, y: number) {
  const side = Math.abs(x)
  const pad = ([atX, atY]: readonly [number, number], [width, height]: readonly [number, number]) =>
    Math.exp(-(((side - atX) / width) ** 2) - ((y - atY) / height) ** 2)
  return (
    0.009 * pad([0.102, -0.044], [0.045, 0.047]) -
    0.007 * pad([0.071, 0.015], [0.041, 0.025]) +
    0.004 * pad([0.018, -0.105], [0.053, 0.045]) +
    0.004 * pad([0.055, 0.055], [0.044, 0.022])
  )
}

function faceFrontDepth(x: number, y: number) {
  const upper = FACE_SECTIONS.findIndex(([height]) => height >= y)
  const [lowY, lowWidth, lowDepth] = FACE_SECTIONS[upper - 1]
  const [highY, highWidth, highDepth] = FACE_SECTIONS[upper]
  const t = (y - lowY) / (highY - lowY)
  const width = lowWidth + (highWidth - lowWidth) * t
  const depth = lowDepth + (highDepth - lowDepth) * t
  const profile = Math.max(0, 1 - (x / width) ** 2)
  return depth * profile ** (faceFrontPower(y) / 2) + facialPlanes(x, y) * Math.sqrt(profile)
}

function faceGeometry(THREE: Three) {
  const positions: number[] = []
  const indices: number[] = []
  const sides = 64
  const subdivisions = 4
  const sections = FACE_SECTIONS.flatMap((section, index) => {
    const next = FACE_SECTIONS[index + 1]
    if (!next) return [[...section]]
    return Array.from({ length: subdivisions }, (_, k) =>
      section.map((value, i) => THREE.MathUtils.lerp(value, next[i], k / subdivisions)),
    )
  })
  sections.forEach(([y, width, front, back], row) => {
    // The cheeks wrap more sharply than the forehead, while the back stays rounded.
    const frontPower = faceFrontPower(y)
    for (let side = 0; side < sides; side++) {
      const angle = (side * Math.PI * 2) / sides
      const cos = Math.cos(angle)
      const x = width * Math.sin(angle)
      const z = cos >= 0 ? front * cos ** frontPower + facialPlanes(x, y) * cos : -back * cos
      const end = width === 0
      positions.push(x, y, end ? front : z)
      if (row === sections.length - 1) continue
      const a = row * sides + side
      const b = row * sides + ((side + 1) % sides)
      if (row !== 0) indices.push(a, b, a + sides)
      if (row !== sections.length - 2) indices.push(b, b + sides, a + sides)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  shadeSkin(THREE, geometry)
  return geometry
}

function shadeSkin(THREE: Three, geometry: BufferGeometry) {
  const normal = geometry.getAttribute('normal')
  const position = geometry.getAttribute('position')
  const colors = new Float32Array(normal.count * 3)
  for (let i = 0; i < normal.count; i++) {
    const light = normal.getZ(i) * 0.8 + normal.getY(i) * 0.32 - normal.getX(i) * 0.26
    const fill = THREE.MathUtils.smoothstep(light, -0.14, 0.44)
    const key = THREE.MathUtils.smoothstep(light, 0.28, 0.74)
    const tone = 0.74 + fill * 0.13 + key * 0.16
    const blood =
      THREE.MathUtils.smoothstep(position.getZ(i), 0.07, 0.145) *
      Math.exp(-(((position.getY(i) + 0.06) / 0.07) ** 2)) *
      THREE.MathUtils.smoothstep(Math.abs(position.getX(i)), 0.03, 0.11)
    colors.set(
      [
        tone * (1 + 0.024 * blood),
        tone * (0.93 + key * 0.07 - blood * 0.052),
        tone * (0.96 + key * 0.04 - blood * 0.031),
      ],
      i * 3,
    )
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.userData.authoredHeadTones = true
}

// Height, half-width and relief above the matching section of the cheek.
const NOSE_SECTIONS = [
  [-0.075, 0.02, 0],
  [-0.066, 0.023, 0.006],
  [-0.058, 0.025, 0.018],
  [-0.052, 0.024, 0.026],
  [-0.046, 0.023, 0.031],
  [-0.04, 0.021, 0.032],
  [-0.034, 0.019, 0.03],
  [-0.023, 0.018, 0.023],
  [-0.009, 0.017, 0.015],
  [0.009, 0.016, 0.009],
  [0.029, 0.017, 0.0035],
  [0.052, 0.02, 0],
] as const

function noseGeometry(THREE: Three) {
  const positions: number[] = []
  const indices: number[] = []
  const columns = 12
  NOSE_SECTIONS.forEach(([y, width, height], row) => {
    for (let column = 0; column <= columns; column++) {
      const x = (2 * column) / columns - 1
      const relief = Math.cos((x * Math.PI) / 2) ** 2
      positions.push(width * x, y, faceFrontDepth(width * x, y) - 0.001 + height * relief)
      if (row === NOSE_SECTIONS.length - 1 || column === columns) continue
      const a = row * (columns + 1) + column
      const c = a + columns + 1
      indices.push(a, a + 1, c, a + 1, c + 1, c)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  shadeSkin(THREE, geometry)
  return geometry
}

function earGeometry(THREE: Three, side: number) {
  const ear = new THREE.SphereGeometry(1, 24, 16)
  const position = ear.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const bowl = Math.max(0, 1 - ((y - 0.13) / 0.7) ** 2 - ((z - 0.24) / 0.55) ** 2)
    const hollow = side * 0.013 * bowl ** 2 * Math.max(0, side * x)
    position.setXYZ(i, x * 0.024 - hollow, y * 0.044, z * 0.028 - y * 0.005)
  }
  ear.computeVertexNormals()
  shadeSkin(THREE, ear)
  return ear
}

function eyeGeometry(THREE: Three, side: number, sclera: boolean) {
  // Inner corner to outer corner. The upper lid carries the heavier ink.
  const shape = new THREE.Shape()
  shape.moveTo(-0.035 * side, -0.004)
  shape.bezierCurveTo(-0.018 * side, 0.009, 0.016 * side, 0.006, 0.039 * side, 0.009)
  shape.bezierCurveTo(0.023 * side, -0.018, -0.013 * side, -0.023, -0.035 * side, -0.004)
  const geometry = new THREE.ShapeGeometry(shape, 12)
  if (sclera) geometry.scale(0.89, 0.79, 1).translate(0, -0.0018, 0)
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++)
    position.setZ(i, -0.0045 * (position.getX(i) / 0.04) ** 2)
  geometry.computeVertexNormals()
  return geometry
}

function irisGeometry(THREE: Three) {
  // Concentric rings let the limbal edge read dark and the iris catch warm light.
  const positions: number[] = []
  const colours: number[] = []
  const indices: number[] = []
  const sides = 32
  const rings = [0, 0.42, 0.74, 0.92, 1]
  const values = [0.27, 0.36, 1, 0.68, 0.23]
  rings.forEach((radius, ring) => {
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides
      const y = Math.sin(angle)
      positions.push(
        Math.cos(angle) * radius * 0.0082,
        y * radius * 0.0089,
        0.0013 * (1 - radius ** 2),
      )
      const fibre = 0.95 + 0.08 * Math.cos(angle * 13) - 0.16 * y
      const value = values[ring] * fibre
      colours.push(value, value * 0.88, value * 0.73)
      if (ring === rings.length - 1) continue
      const a = ring * sides + i
      const b = ring * sides + ((i + 1) % sides)
      indices.push(a, a + sides, b + sides)
      if (ring > 0) indices.push(a, b + sides, b)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.userData.authoredHeadTones = true
  return geometry
}

function browGeometry(THREE: Three, side: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-0.03 * side, -0.004)
  shape.quadraticCurveTo(-0.005 * side, 0.018, 0.035 * side, 0.001)
  shape.quadraticCurveTo(0.003 * side, 0.011, -0.03 * side, -0.009)
  return new THREE.ShapeGeometry(shape, 10)
}

function addFaceFeatures(build: HumanHeadBuild, head: Group, shadedSkin: Mesh['material']) {
  const { THREE, glow, geometry } = build
  addMangaEyes(build, head)
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'left' : 'right'
    const eye = head.getObjectByName(`face-eye-${suffix}`) as Mesh
    eye.geometry = geometry(THREE, `hisoka:upper-lid:${suffix}`, () =>
      eyeGeometry(THREE, side, false),
    )
    eye.position.set(side * 0.067, 0.016, 0.166)
    eye.rotation.y = side * 0.22
    eye.rotation.z += side * 0.035
    const white = eye.getObjectByName('eye-sclera') as Mesh
    white.geometry = geometry(THREE, `hisoka:sclera:${suffix}`, () =>
      eyeGeometry(THREE, side, true),
    )
    const iris = eye.getObjectByName('eye-pupil') as Mesh
    iris.geometry = geometry(THREE, 'hisoka:iris', () => irisGeometry(THREE))
    iris.material = new THREE.MeshBasicMaterial({ color: 0xc79256, vertexColors: true })
    iris.position.y = -0.004
    iris.scale.set(1.16, 1.16, 1)
    // A separate offset lets the shared gaze and Clash's expression both drive the iris.
    const gaze = new THREE.Group()
    gaze.name = 'hisoka-gaze'
    gaze.add(iris)
    eye.add(gaze)
    const brow = head.getObjectByName(`face-brow-${suffix}`) as Mesh
    brow.geometry = geometry(THREE, `hisoka:brow:${suffix}`, () => browGeometry(THREE, side))
    brow.position.set(side * 0.068, 0.051, 0.167)
    brow.rotation.y = side * 0.24
    brow.rotation.z += side * 0.08

    const ear = new THREE.Mesh(
      geometry(THREE, `hisoka:ear:${suffix}`, () => earGeometry(THREE, side)),
      shadedSkin,
    )
    ear.position.set(side * 0.145, -0.027, -0.015)
    ear.rotation.z = side * -0.2
    head.add(ear)
  }

  const nose = new THREE.Mesh(
    geometry(THREE, 'hisoka:nose', () => noseGeometry(THREE)),
    shadedSkin,
  )
  nose.name = 'face-relief'
  const mouth = new THREE.Mesh(
    geometry(THREE, 'hisoka:mouth', () =>
      kurapikaPanel(THREE, [
        [-0.03, 0.001, -0.002],
        [-0.011, 0.003, 0],
        [0.001, 0.001, 0],
        [0.014, 0.003, 0],
        [0.031, 0.002, -0.002],
        [0.011, -0.002, 0],
        [-0.008, -0.003, 0],
      ]),
    ),
    glow(0x482b39, 1),
  )
  mouth.name = 'face-mouth'
  mouth.position.set(0, -0.111, 0.168)
  head.add(nose, mouth)

  const contours = new THREE.Mesh(
    geometry(THREE, 'hisoka:face-contours', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.009, 0.0016).rotateZ(-0.3).translate(-0.01, -0.059, 0.183),
        new THREE.PlaneGeometry(0.008, 0.0015).rotateZ(0.37).translate(0.01, -0.059, 0.182),
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.019, -0.12, 0.164),
            new THREE.Vector3(-0.008, -0.124, 0.166),
            new THREE.Vector3(0.007, -0.123, 0.166),
            new THREE.Vector3(0.018, -0.119, 0.165),
          ]),
          14,
          0.0012,
          6,
        ),
      ]),
    ),
    glow(0x997365, 1),
  )
  contours.name = 'clash-face-contours'
  head.add(contours)
}

export function buildHisokaHead(build: HumanHeadBuild): Group {
  const { THREE, geometry, outlined, materials, profile } = build
  const head = new THREE.Group()
  head.name = 'manga-head:hisoka'
  head.position.y = mangaLikeness(profile).headY
  const face = outlined({
    THREE,
    geometry: geometry(THREE, 'hisoka:face', () => faceGeometry(THREE)),
    material: materials.skin,
    ink: materials.ink,
    scale: 1.018,
  })
  face.name = 'manga-face'
  head.add(face)
  addFaceFeatures(build, head, (face.children[1] as Mesh).material)
  addHisokaHair(build, head)
  addMangaFaceTraits(build, head)
  return head
}

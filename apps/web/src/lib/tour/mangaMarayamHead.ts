import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'

/** Short, broken tufts follow the round skull instead of forming an upright crown. */
export function mangaMarayamCrop(kit: MangaHairKit) {
  const { THREE } = kit
  const cap = mangaScalpGeometry(kit)
  const position = cap.getAttribute('position'),
    source = cap.index!
  const triangles: number[] = []
  for (let i = 0; i < source.count; i += 3) {
    const ids = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    if (!ids.some((id) => position.getZ(id) > 0.07 && position.getY(id) < 0.14))
      triangles.push(...ids)
  }
  cap.setIndex(triangles)
  cap.scale(1.04, 1, 1.08).translate(0, 0.018, 0)
  kit.parts.push(cap)
  kit.parts.push(
    new THREE.SphereGeometry(1, 28, 16).scale(0.145, 0.035, 0.195).translate(0, 0.19, 0),
  )
  for (let i = 0; i < 15; i++) {
    const angle = (i * Math.PI * 2) / 15
    const x = Math.cos(angle) * 0.13,
      z = Math.sin(angle) * 0.115
    kit.lock({
      width: 0.027,
      depth: 0.022,
      points: [
        [x, 0.14, z],
        [x * 1.08, 0.19, z * 1.08],
        [x * 1.24 - 0.014, 0.235 + (i % 3) * 0.015, z * 1.17],
      ],
    })
  }
  kit.lock({
    width: 0.046,
    depth: 0.03,
    points: [
      [-0.035, 0.21, 0.015],
      [-0.025, 0.25, 0.01],
      [-0.045, 0.282, 0.005],
    ],
  })
  const fringe = kurapikaPanel(THREE, [
    [-0.155, 0.105, 0.177],
    [-0.132, 0.137, 0.178],
    [-0.105, 0.12, 0.179],
    [-0.071, 0.156, 0.18],
    [-0.049, 0.138, 0.181],
    [-0.012, 0.175, 0.181],
    [0.022, 0.153, 0.181],
    [0.06, 0.177, 0.18],
    [0.098, 0.147, 0.179],
    [0.13, 0.157, 0.178],
    [0.156, 0.105, 0.177],
    [0.12, 0.205, 0.13],
    [0, 0.235, 0.09],
    [-0.12, 0.205, 0.13],
  ])
  fringe.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      new Float32Array(fringe.getAttribute('position').count * 2),
      2,
    ),
  )
  kit.parts.push(fringe)
}

function childEye(build: HumanHeadBuild, inset: boolean): BufferGeometry {
  const { THREE } = build
  const path = new THREE.Shape()
  path.moveTo(-0.037, -0.002)
  path.bezierCurveTo(-0.026, 0.04, 0.025, 0.038, 0.037, 0.001)
  path.bezierCurveTo(0.028, -0.028, -0.025, -0.03, -0.037, -0.002)
  const made = new THREE.ShapeGeometry(path, 18)
  return inset ? made.scale(0.88, 0.83, 1) : made
}

function childEyes(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(`face-eye-${side < 0 ? 'left' : 'right'}`) as Mesh
    eye.geometry = geometry(THREE, 'manga:marayam-eye-outline', () => childEye(build, false))
    eye.position.set(side * 0.088, 0.005, 0.174)
    eye.rotation.z = side * 0.015
    const white = eye.getObjectByName('eye-sclera') as Mesh
    white.geometry = geometry(THREE, 'manga:marayam-eye-white', () => childEye(build, true))
    const brow = head.getObjectByName(`face-brow-${side < 0 ? 'left' : 'right'}`)!
    brow.position.set(side * 0.092, 0.077, 0.173)
    brow.scale.x = 0.66
    brow.rotation.z = side * 0.07
  }
}

export function addMarayamFace(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  const face = head.getObjectByName('manga-face')!
  const rounded = geometry(THREE, 'manga:marayam-round-cheeks', () => {
    const made = new THREE.LatheGeometry(
      [
        [0, -0.178],
        [0.05, -0.174],
        [0.099, -0.159],
        [0.147, -0.131],
        [0.18, -0.09],
        [0.2, -0.035],
        [0.203, 0.025],
        [0.196, 0.095],
        [0.17, 0.16],
        [0.11, 0.212],
        [0, 0.23],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      40,
    )
    const positions = made.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i)
      positions.setZ(i, z > 0 ? Math.min(0.171, z * 1.32) : z * 0.93)
    }
    made.computeVertexNormals()
    return made
  })
  for (const part of face.children) (part as Mesh).geometry = rounded
  childEyes(build, head)
  const nose = head.getObjectByName('face-relief') as Mesh
  nose.geometry = geometry(THREE, 'manga:marayam-button-nose', () =>
    new THREE.SphereGeometry(1, 12, 8).scale(0.009, 0.012, 0.009),
  )
  nose.position.set(0, -0.043, 0.175)
  const mouth = head.getObjectByName('face-mouth') as Mesh
  mouth.geometry = geometry(THREE, 'manga:marayam-small-mouth', () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.026, 0, 0),
      new THREE.Vector3(-0.012, 0.003, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.014, 0.003, 0),
      new THREE.Vector3(0.026, 0, 0),
    ])
    return new THREE.TubeGeometry(curve, 20, 0.0013, 4, false)
  })
  mouth.position.set(0, -0.105, 0.174)
  mouth.userData.expressionCurve = true
  const cheeks = new THREE.Mesh(
    geometry(THREE, 'manga:marayam-cheek-marks', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        for (let i = 0; i < 2; i++)
          parts.push(
            new THREE.PlaneGeometry(0.0014, 0.014)
              .rotateZ(-0.38)
              .translate(side * (0.108 + i * 0.012), -0.052, 0.174),
          )
        parts.push(
          new THREE.TorusGeometry(0.012, 0.002, 5, 14, Math.PI * 1.3)
            .scale(0.7, 1.3, 1)
            .rotateZ(side * 0.4)
            .translate(side * 0.207, -0.025, 0.015),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x997961, 1),
  )
  cheeks.name = 'marayam-cheek-and-ear-details'
  head.add(cheeks)
  nose.material = materials.skin
}

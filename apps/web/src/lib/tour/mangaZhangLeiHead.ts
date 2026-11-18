import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { Point3 } from './kurapikaGeometry'
import { kurapikaPanel } from './kurapikaGeometry'
import { addMangaEyes } from './mangaEyes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { mangaLikeness } from './mangaLikeness'

function stroke(build: HumanHeadBuild, points: readonly Point3[], radius = 0.0017) {
  const { THREE } = build
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    24,
    radius,
    5,
    false,
  )
}

function squareSkull(build: HumanHeadBuild) {
  const { THREE } = build
  const shape = new THREE.LatheGeometry(
    [
      [0, -0.23],
      [0.108, -0.23],
      [0.15, -0.215],
      [0.18, -0.14],
      [0.185, -0.02],
      [0.18, 0.11],
      [0.174, 0.145],
      [0.16, 0.18],
      [0.14, 0.218],
      [0.105, 0.248],
      [0.065, 0.269],
      [0, 0.28],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    40,
  )
  const position = shape.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const z = position.getZ(i)
    position.setZ(i, z > 0 ? Math.min(0.171, z * 1.32) : z * 0.98)
  }
  shape.computeVertexNormals()
  return shape
}

function squareEye(build: HumanHeadBuild, inset: boolean) {
  const { THREE } = build
  const path = new THREE.Shape()
  path.moveTo(-0.038, 0.013)
  path.lineTo(0.038, 0.009)
  path.lineTo(0.031, -0.02)
  path.lineTo(-0.033, -0.018)
  path.closePath()
  const eye = new THREE.ShapeGeometry(path)
  return inset ? eye.scale(0.87, 0.7, 1) : eye
}

function addEyesAndFolds(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  addMangaEyes(build, head)
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'left' : 'right'
    const eye = head.getObjectByName(`face-eye-${suffix}`) as Mesh
    eye.geometry = geometry(THREE, 'manga:zhanglei-square-eye', () => squareEye(build, false))
    eye.position.set(side * 0.076, 0, 0.174)
    eye.rotation.z = side * -0.025
    const white = eye.getObjectByName('eye-sclera') as Mesh
    white.geometry = geometry(THREE, 'manga:zhanglei-square-sclera', () => squareEye(build, true))
    const iris = eye.getObjectByName('eye-pupil')!
    iris.scale.setScalar(0.8)
    iris.position.y = -0.004
    const brow = head.getObjectByName(`face-brow-${suffix}`) as Mesh
    // These are skin folds arching from the nose bridge, not eyebrow hair.
    brow.geometry = geometry(THREE, `manga:zhanglei-nose-arch:${side}`, () =>
      stroke(build, [
        [side * -0.058, -0.105, 0.006],
        [side * -0.059, -0.034, 0.006],
        [side * -0.034, 0.018, 0.004],
        [side * 0.007, 0.019, 0.002],
        [side * 0.047, -0.005, -0.001],
      ]),
    )
    brow.material = glow(0x5c4132, 1)
    brow.position.set(side * 0.076, 0.067, 0.172)
    brow.scale.set(1, 1, 1)
    brow.rotation.set(0, 0, 0)
  }
}

function addForeheadDots(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  const dots = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-six-forehead-dots', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++) {
          parts.push(
            new THREE.SphereGeometry([0.0085, 0.006, 0.0035][i], 12, 8)
              .scale(1, 1, 0.25)
              .translate(side * 0.061, 0.12 + i * 0.037, 0.174),
          )
        }
      return mergeHumanDetails(parts)
    }),
    materials.ink,
  )
  dots.name = 'zhanglei-six-forehead-dots'
  head.add(dots)
}

function addFaceDetails(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  const details = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-eye-bags-and-nose', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          stroke(build, [
            [side * 0.039, -0.03, 0.175],
            [side * 0.076, -0.045, 0.175],
            [side * 0.108, -0.033, 0.173],
          ]),
        )
        parts.push(
          stroke(
            build,
            [
              [side * 0.041, -0.05, 0.174],
              [side * 0.068, -0.064, 0.175],
              [side * 0.1, -0.055, 0.174],
            ],
            0.0013,
          ),
        )
        parts.push(
          stroke(
            build,
            [
              [side * 0.012, -0.035, 0.18],
              [side * 0.014, -0.074, 0.181],
              [side * 0.025, -0.081, 0.176],
            ],
            0.0015,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x5c4132, 1),
  )
  details.name = 'zhanglei-eye-bags-and-nose-folds'
  head.add(details)
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-nose-tip', () =>
      new THREE.SphereGeometry(1, 16, 10).scale(0.016, 0.01, 0.014),
    ),
    materials.skin,
  )
  nose.name = 'face-relief'
  nose.position.set(0, -0.075, 0.176)
  const moustache = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-pencil-moustache', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          stroke(
            build,
            [
              [side * 0.008, -0.09, 0.176],
              [side * 0.033, -0.092, 0.176],
              [side * 0.067, -0.102, 0.175],
              [side * 0.084, -0.103, 0.173],
            ],
            0.0022,
          ),
        ),
      ),
    ),
    materials.hairInk,
  )
  moustache.name = 'signature:moustache'
  const mouth = new THREE.Mesh(
    geometry(THREE, 'manga:zhanglei-thin-mouth', () =>
      kurapikaPanel(THREE, [
        [-0.039, 0, 0],
        [0, -0.002, 0],
        [0.039, 0, 0],
        [0, -0.004, 0],
      ]),
    ),
    materials.ink,
  )
  mouth.name = 'face-mouth'
  mouth.position.set(0, -0.127, 0.174)
  head.add(nose, moustache, mouth)
}

function addEarlobes(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const ear = build.outlined({
      THREE,
      geometry: geometry(THREE, 'manga:zhanglei-earlobe', () =>
        new THREE.SphereGeometry(1, 20, 16).scale(0.025, 0.095, 0.022),
      ),
      material: materials.skin,
      ink: materials.ink,
      scale: 1.03,
    })
    ear.name = 'zhanglei-long-earlobe'
    ear.position.set(side * 0.196, -0.04, -0.002)
    head.add(ear)
    const fold = new THREE.Mesh(
      geometry(THREE, `manga:zhanglei-ear-fold:${side}`, () =>
        stroke(
          build,
          [
            [side * 0.201, 0.019, 0.02],
            [side * 0.212, -0.013, 0.021],
            [side * 0.204, -0.07, 0.021],
            [side * 0.195, -0.09, 0.02],
          ],
          0.0018,
        ),
      ),
      glow(0x5c4132, 1),
    )
    fold.name = 'zhanglei-ear-fold'
    head.add(fold)
  }
}

export function buildZhangLeiHead(build: HumanHeadBuild): Group {
  const { THREE, geometry, materials } = build
  const head = new THREE.Group()
  head.name = 'manga-head:prince-zhanglei'
  head.position.y = mangaLikeness(build.profile).headY
  const face = build.outlined({
    THREE,
    geometry: geometry(THREE, 'manga:zhanglei-bald-square-skull', () => squareSkull(build)),
    material: materials.skin,
    ink: materials.ink,
    scale: 1.022,
  })
  ;(face.children[1] as Mesh).material = materials.skin
  face.name = 'manga-face'
  head.add(face)
  addEyesAndFolds(build, head)
  addForeheadDots(build, head)
  addFaceDetails(build, head)
  addEarlobes(build, head)
  return head
}

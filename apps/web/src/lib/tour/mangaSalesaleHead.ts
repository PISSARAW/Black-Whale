import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { Point3 } from './kurapikaGeometry'
import { buildMangaHead } from './mangaHead'
import { salesaleSkullGeometry } from './mangaSalesaleGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

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

function smileGeometry(build: HumanHeadBuild, teeth: boolean) {
  const { THREE } = build
  const shape = new THREE.Shape()
  if (teeth) {
    shape.moveTo(-0.078, 0.014)
    shape.quadraticCurveTo(-0.015, 0.021, 0.075, 0.009)
    shape.lineTo(0.063, -0.009)
    shape.quadraticCurveTo(0, -0.017, -0.064, -0.004)
  } else {
    shape.moveTo(-0.094, 0.013)
    shape.quadraticCurveTo(-0.085, 0.038, -0.072, 0.028)
    shape.quadraticCurveTo(0, 0.027, 0.094, 0.007)
    shape.quadraticCurveTo(0.071, -0.037, 0.02, -0.036)
    shape.quadraticCurveTo(-0.065, -0.034, -0.094, 0.013)
  }
  shape.closePath()
  return new THREE.ShapeGeometry(shape, 24)
}

function addSmile(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  const mouth = head.getObjectByName('face-mouth') as Mesh
  mouth.geometry = geometry(THREE, 'manga:salesale-wide-smile', () => smileGeometry(build, false))
  mouth.material = materials.ink
  mouth.position.set(0, -0.095, 0.181)
  mouth.userData.expressionTeeth = true
  const teeth = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-smile-teeth', () => smileGeometry(build, true)),
    glow(0xfffae9, 1),
  )
  teeth.name = 'salesale-smile-teeth'
  teeth.position.z = 0.001
  mouth.add(teeth)
}

function addCheekFolds(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-cheek-and-chin-folds', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          stroke(
            build,
            [
              [side * 0.097, -0.068, 0.178],
              [side * 0.119, -0.092, 0.173],
              [side * 0.106, -0.153, 0.155],
            ],
            0.0016,
          ),
        )
        parts.push(
          stroke(
            build,
            [
              [side * 0.135, -0.055, 0.16],
              [side * 0.147, -0.094, 0.158],
              [side * 0.132, -0.135, 0.152],
            ],
            0.0013,
          ),
        )
        parts.push(
          stroke(
            build,
            [
              [side * 0.017, -0.022, 0.183],
              [side * 0.029, -0.05, 0.19],
              [side * 0.017, -0.059, 0.188],
            ],
            0.0015,
          ),
        )
      }
      parts.push(
        stroke(
          build,
          [
            [-0.073, -0.168, 0.143],
            [-0.025, -0.185, 0.145],
            [0.043, -0.183, 0.139],
            [0.085, -0.159, 0.133],
          ],
          0.0014,
        ),
      )
      return mergeHumanDetails(parts)
    }),
    glow(0x936c50, 1),
  )
  folds.name = 'salesale-cheek-and-chin-folds'
  head.add(folds)
}

function addRightPiercings(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  const ear = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-right-ear', () =>
      new THREE.SphereGeometry(1, 20, 14).scale(0.023, 0.041, 0.023),
    ),
    materials.skin,
  )
  ear.name = 'salesale-right-ear'
  ear.position.set(-0.205, -0.023, 0.018)
  head.add(ear)
  const piercings = new THREE.Group()
  piercings.name = 'salesale-right-ear-piercings'
  const shape = geometry(
    THREE,
    'manga:salesale-dark-ear-ring',
    () => new THREE.TorusGeometry(0.005, 0.0016, 6, 16),
  )
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(shape, glow(0x252326, 1))
    ring.name = 'salesale-dark-ear-ring'
    ring.position.set(-0.218 + i * 0.003, -0.027 - i * 0.014, 0.039)
    piercings.add(ring)
  }
  head.add(piercings)
}

function addEyesAndBrows(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')!
    eye.position.z = 0.18
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right') as Mesh
    brow.geometry = geometry(THREE, `manga:salesale-curved-brow:${side}`, () =>
      stroke(
        build,
        [
          [side * -0.031, 0.008, 0],
          [side * -0.014, -0.006, 0.001],
          [side * 0.012, -0.004, 0],
          [side * 0.034, 0.003, -0.002],
        ],
        0.0028,
      ),
    )
    brow.material = materials.ink
    brow.position.set(side * 0.067, 0.063, 0.181)
    brow.scale.set(1, 1, 1)
  }
}

export function buildSalesaleHead(build: HumanHeadBuild): Group {
  const { THREE, geometry, materials } = build
  const head = buildMangaHead(build)
  const skull = geometry(THREE, 'manga:salesale-round-skull', () => salesaleSkullGeometry(THREE))
  for (const mesh of head.getObjectByName('manga-face')!.children) (mesh as Mesh).geometry = skull
  const nose = head.getObjectByName('face-relief') as Mesh
  nose.geometry = geometry(THREE, 'manga:salesale-nose', () =>
    mergeHumanDetails([
      new THREE.SphereGeometry(1, 20, 14).scale(0.019, 0.039, 0.019).translate(0, 0.009, 0),
      new THREE.SphereGeometry(1, 20, 14).scale(0.026, 0.018, 0.027).translate(0, -0.019, 0.009),
    ]),
  )
  nose.material = materials.skin
  nose.position.set(0, -0.027, 0.178)
  addEyesAndBrows(build, head)
  addSmile(build, head)
  addCheekFolds(build, head)
  addRightPiercings(build, head)
  return head
}

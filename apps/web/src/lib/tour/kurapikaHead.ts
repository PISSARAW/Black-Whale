import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { kurapikaFaceGeometry, kurapikaPanel } from './kurapikaGeometry'
import { addKurapikaHair } from './kurapikaHair'
import { mergeHumanDetails } from './humanDetailGeometry'

function eyeOutline(build: HumanHeadBuild) {
  const { THREE } = build
  const shape = new THREE.Shape()
  shape.moveTo(-0.037, -0.008)
  shape.bezierCurveTo(-0.032, 0.024, 0.021, 0.035, 0.037, 0.003)
  shape.bezierCurveTo(0.031, -0.037, -0.027, -0.039, -0.037, -0.008)
  return new THREE.ShapeGeometry(shape, 12)
}

function addEyes(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, glow, materials } = build
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      geometry(THREE, 'kurapika:eye-outline', () => eyeOutline(build)),
      materials.ink,
    )
    eye.name = side < 0 ? 'face-eye-left' : 'face-eye-right'
    eye.position.set(side * 0.067, -0.004, 0.121)
    eye.rotation.y = side * 0.1
    const white = new THREE.Mesh(
      geometry(THREE, 'kurapika:eye-white', () => eyeOutline(build).scale(0.88, 0.85, 1)),
      glow(0xfffcf5, 1),
    )
    white.name = 'eye-sclera'
    white.position.z = 0.001
    const iris = new THREE.Mesh(
      geometry(THREE, 'kurapika:iris', () => new THREE.CircleGeometry(0.023, 24)),
      glow(0x302d28, 1),
    )
    iris.name = 'eye-pupil'
    iris.position.set(side * -0.002, -0.004, 0.002)
    iris.scale.y = 1.07
    const pupil = new THREE.Mesh(
      geometry(THREE, 'kurapika:pupil-core', () => new THREE.CircleGeometry(0.012, 18)),
      materials.ink,
    )
    pupil.position.z = 0.001
    pupil.scale.y = 1.2
    const light = new THREE.Mesh(
      geometry(THREE, 'kurapika:eye-catchlights', () =>
        mergeHumanDetails([
          new THREE.CircleGeometry(0.0065, 12).translate(-0.008, 0.01, 0.002),
          new THREE.CircleGeometry(0.0027, 8).translate(0.01, -0.012, 0.002),
        ]),
      ),
      glow(0xfffcf5, 1),
    )
    iris.add(pupil, light)
    eye.add(white, iris)
    head.add(eye)
    const brow = new THREE.Mesh(
      geometry(THREE, 'kurapika:brow', () =>
        kurapikaPanel(THREE, [
          [-0.033, 0, 0],
          [-0.008, 0.008, 0],
          [0.028, 0.003, 0],
          [0.026, -0.001, 0],
          [-0.01, 0.003, 0],
        ]),
      ),
      materials.ink,
    )
    brow.name = side < 0 ? 'face-brow-left' : 'face-brow-right'
    brow.position.set(side * 0.067, 0.063, 0.119)
    brow.rotation.z = side * -0.12
    head.add(brow)
  }
}

/** Custom likeness shares the public head/eye names used by combat and aura effects. */
export function buildKurapikaHead(build: HumanHeadBuild): Group {
  const { THREE, geometry, outlined, materials, glow } = build
  const head = new THREE.Group()
  head.name = 'kurapika-head'
  head.position.y = 1.64
  const skull = outlined({
    THREE,
    geometry: geometry(THREE, 'kurapika:face', () => kurapikaFaceGeometry(THREE)),
    material: materials.skin,
    ink: materials.ink,
    scale: 1.018,
  })
  ;(skull.children[1] as Mesh).material = materials.skin
  skull.name = 'kurapika-face'
  head.add(skull)
  addEyes(build, head)
  const nose = new THREE.Mesh(
    geometry(THREE, 'kurapika:nose-volume', () =>
      new THREE.ConeGeometry(0.009, 0.026, 5).rotateX(Math.PI / 2).translate(0, -0.057, 0.126),
    ),
    materials.skin,
  )
  nose.name = 'face-relief'
  const noseLine = new THREE.Mesh(
    geometry(THREE, 'kurapika:nose-line', () =>
      kurapikaPanel(THREE, [
        [-0.004, -0.058, 0.136],
        [0.001, -0.063, 0.139],
        [0.005, -0.063, 0.133],
      ]),
    ),
    glow(0x89776a, 1),
  )
  nose.add(noseLine)
  head.add(nose)
  const mouth = new THREE.Mesh(
    geometry(THREE, 'kurapika:mouth', () =>
      kurapikaPanel(THREE, [
        [-0.014, -0.11, 0.089],
        [0, -0.107, 0.092],
        [0.012, -0.11, 0.089],
        [0.001, -0.111, 0.092],
      ]),
    ),
    materials.ink,
  )
  mouth.name = 'face-mouth'
  head.add(mouth)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      geometry(THREE, 'kurapika:ear', () =>
        new THREE.SphereGeometry(1, 12, 8).scale(0.019, 0.031, 0.014),
      ),
      materials.skin,
    )
    ear.position.set(side * 0.147, -0.036, 0)
    head.add(ear)
  }
  addKurapikaHair(build, head)
  return head
}

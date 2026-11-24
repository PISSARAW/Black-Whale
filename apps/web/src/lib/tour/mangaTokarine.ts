import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock } from './kurapikaGeometry'

export function addTokarineFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow, outlined } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    if (oldEye) oldEye.visible = false
    const eye = new THREE.Mesh(
      geometry(THREE, 'manga:tokarine-beady-eye', () => new THREE.CircleGeometry(0.011, 18)),
      materials.ink,
    )
    eye.name = 'tokarine-beady-eye'
    eye.position.set(side * 0.066, 0.014, 0.181)
    head.add(eye)
    for (let i = 0; i < 2; i++) {
      const piercing = new THREE.Mesh(
        geometry(THREE, `manga:tokarine-ear-piercing:${i}`, () =>
          i === 0
            ? new THREE.TorusGeometry(0.012, 0.003, 6, 18)
            : new THREE.CircleGeometry(0.005, 12),
        ),
        glow(i === 0 ? 0xb29b64 : 0xd4c7a2, 1),
      )
      piercing.name = 'tokarine-ear-piercing'
      piercing.position.set(side * 0.209, -0.035 - i * 0.025, 0.015)
      head.add(piercing)
    }
  }

  const oldNose = head.getObjectByName('face-relief')
  const oldMouth = head.getObjectByName('face-mouth')
  if (oldNose) oldNose.visible = false
  if (oldMouth) oldMouth.visible = false
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:tokarine-snub-nose', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.018, 0.0024, 6, 18, Math.PI).rotateZ(Math.PI),
        new THREE.CircleGeometry(0.0035, 8).translate(-0.015, -0.003, 0),
        new THREE.CircleGeometry(0.0035, 8).translate(0.015, -0.003, 0),
      ]),
    ),
    materials.ink,
  )
  nose.name = 'tokarine-snub-nose'
  nose.position.set(0, -0.038, 0.183)
  head.add(nose)
  const lips = new THREE.Mesh(
    geometry(THREE, 'manga:tokarine-full-lips', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.04, 0)
      shape.quadraticCurveTo(-0.018, 0.027, 0, 0.01)
      shape.quadraticCurveTo(0.018, 0.027, 0.04, 0)
      shape.quadraticCurveTo(0.018, -0.027, 0, -0.013)
      shape.quadraticCurveTo(-0.018, -0.027, -0.04, 0)
      return new THREE.ShapeGeometry(shape, 16)
    }),
    glow(0x81524e, 1),
  )
  lips.name = 'tokarine-full-lips'
  lips.position.set(0, -0.112, 0.18)
  head.add(lips)

  for (const side of [-1, 1]) {
    const cheek = outlined({
      THREE,
      geometry: geometry(THREE, 'manga:tokarine-full-cheek', () =>
        new THREE.SphereGeometry(1, 14, 10).scale(0.082, 0.077, 0.052),
      ),
      material: materials.skin,
      ink: materials.ink,
      scale: 1.015,
    })
    cheek.name = 'tokarine-full-cheek'
    cheek.position.set(side * 0.112, -0.075, 0.115)
    head.add(cheek)
  }
  const chinFold = new THREE.Mesh(
    geometry(THREE, 'manga:tokarine-chin-fold', () =>
      new THREE.TorusGeometry(0.065, 0.0025, 6, 28, Math.PI).rotateZ(Math.PI),
    ),
    glow(0x765d52, 0.7),
  )
  chinFold.name = 'tokarine-chin-fold'
  chinFold.position.set(0, -0.167, 0.145)
  head.add(chinFold)

  const crown = new THREE.Mesh(
    geometry(THREE, 'manga:tokarine-light-hair-crown', () =>
      new THREE.SphereGeometry(1, 22, 12).scale(0.172, 0.062, 0.148),
    ),
    glow(0xa9907d, 1),
  )
  crown.name = 'tokarine-light-hair-crown'
  crown.position.set(0, 0.19, -0.005)
  head.add(crown)
  for (const side of [-1, 1]) {
    const lock = new THREE.Mesh(
      geometry(THREE, `manga:tokarine-side-lock:${side}`, () =>
        kurapikaLock(THREE, {
          width: 0.026,
          depth: 0.012,
          points: [
            [side * 0.13, 0.105, 0.13],
            [side * 0.18, 0.055, 0.12],
            [side * 0.205, 0.015, 0.09],
            [side * 0.24, 0.005, 0.06],
          ],
        }),
      ),
      materials.hairInk,
    )
    lock.name = 'tokarine-side-pointing-lock'
    head.add(lock)
  }
}

export function addTokarineStripedTop(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest } = mangaBodyShape(profile)
  const bands = []
  for (let i = 0; i < 4; i++)
    bands.push(
      new THREE.BoxGeometry(chest * 1.65, 0.055, 0.012).translate(0, 1.03 + i * 0.105, 0.175),
    )
  const stripes = new THREE.Mesh(
    geometry(THREE, 'manga:tokarine-striped-top', () => mergeHumanDetails(bands)),
    materials.dark,
  )
  stripes.name = 'tokarine-striped-top'
  figure.add(stripes)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `tokarine-central-emblem-${side}`,
      points: [
        [side * 0.025, 1.37],
        [side * 0.14, 1.31],
        [side * 0.115, 1.16],
        [side * 0.018, 1.22],
      ],
      material: materials.dark,
      lift: 0.014,
    })
}

export function addTokarineSleeveStripes(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow, profile } = build
  for (const arm of [...limbs.arms, ...limbs.elbows])
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(
        geometry(
          THREE,
          `manga:tokarine-sleeve-stripe:${i}`,
          () => new THREE.CylinderGeometry(0.064, 0.064, 0.035, 16),
        ),
        glow(profile.accent, 1),
      )
      band.name = 'tokarine-sleeve-stripe'
      band.position.y = -0.09 - i * 0.1
      arm.add(band)
    }
}

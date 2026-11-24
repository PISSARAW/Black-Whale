import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addSanbicaMedicalHeadwear(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, glow } = build
  const oldNose = head.getObjectByName('face-relief')
  const oldMouth = head.getObjectByName('face-mouth')
  if (oldNose) oldNose.visible = false
  if (oldMouth) oldMouth.visible = false

  const mask = new THREE.Mesh(
    geometry(THREE, 'manga:sanbica-surgical-mask', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.142, 0.025)
      shape.quadraticCurveTo(0, 0.052, 0.142, 0.025)
      shape.lineTo(0.12, -0.092)
      shape.quadraticCurveTo(0, -0.145, -0.12, -0.092)
      shape.closePath()
      return new THREE.ShapeGeometry(shape, 18)
    }),
    glow(0xf0f2ed, 1),
  )
  mask.name = 'sanbica-surgical-mask'
  mask.position.set(0, -0.074, 0.184)
  head.add(mask)
  const maskFolds = new THREE.Mesh(
    geometry(THREE, 'manga:sanbica-mask-folds', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.17, 0.0025).translate(0, -0.04, 0),
        new THREE.PlaneGeometry(0.15, 0.0025).translate(0, -0.071, 0),
        new THREE.PlaneGeometry(0.003, 0.08).translate(0, -0.058, 0),
      ]),
    ),
    glow(0x9ca5a0, 0.65),
  )
  maskFolds.position.set(0, -0.074, 0.186)
  head.add(maskFolds)

  const cap = new THREE.Mesh(
    geometry(THREE, 'manga:sanbica-medical-cap', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.175, 0.02)
      shape.lineTo(-0.135, -0.08)
      shape.quadraticCurveTo(0, -0.125, 0.135, -0.08)
      shape.lineTo(0.175, 0.02)
      shape.quadraticCurveTo(0, -0.025, -0.175, 0.02)
      shape.closePath()
      return new THREE.ShapeGeometry(shape, 18)
    }),
    glow(0xf4f3ed, 1),
  )
  cap.name = 'sanbica-medical-cap'
  cap.position.set(0, 0.145, 0.184)
  head.add(cap)
  const cross = new THREE.Mesh(
    geometry(THREE, 'manga:sanbica-medical-cross', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.022, 0.062),
        new THREE.PlaneGeometry(0.062, 0.022),
      ]),
    ),
    glow(0x8eb79b, 1),
  )
  cross.name = 'sanbica-medical-cross'
  cross.position.set(0, 0.116, 0.187)
  head.add(cross)
  const centre = new THREE.Mesh(
    geometry(THREE, 'manga:sanbica-cross-centre', () => new THREE.CircleGeometry(0.008, 12)),
    glow(0xd48f96, 1),
  )
  centre.position.set(0, 0.116, 0.188)
  head.add(centre)
}

export function addSanbicaMedicalGown(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist } = mangaBodyShape(profile)
  const gown = new THREE.Mesh(
    geometry(THREE, 'manga:sanbica-concealing-gown', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(waist * 1.55, 0.18),
          new THREE.Vector2(waist * 1.62, 0.5),
          new THREE.Vector2(waist * 1.35, 0.82),
          new THREE.Vector2(chest, 1.22),
          new THREE.Vector2(chest * 0.83, 1.43),
        ],
        32,
      ).scale(1, 1, 0.82),
    ),
    materials.cloth,
  )
  gown.name = 'sanbica-concealing-gown'
  figure.add(gown)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:sanbica-gown-collar',
      () => new THREE.CylinderGeometry(chest * 0.35, chest * 0.48, 0.13, 28, 1, true),
    ),
    materials.shirt,
  )
  collar.name = 'sanbica-gown-collar'
  collar.position.y = 1.47
  figure.add(collar)
}

export function addSanbicaMedicalGloves(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow } = build
  for (const elbow of limbs.elbows) {
    const hand = elbow.getObjectByName('hand-left') ?? elbow.getObjectByName('hand-right')
    if (!hand) continue
    const glove = new THREE.Mesh(
      geometry(THREE, 'manga:sanbica-medical-glove', () =>
        new THREE.SphereGeometry(1, 12, 8).scale(0.047, 0.066, 0.032),
      ),
      glow(0xe8eeeb, 1),
    )
    glove.name = 'sanbica-medical-glove'
    glove.position.y = -0.012
    hand.add(glove)
  }
}

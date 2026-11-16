import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addFeitanCoat(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { waist } = mangaBodyShape(profile)
  const coat = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-long-coat', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(waist * 1.76, -0.1),
          new THREE.Vector2(waist * 1.71, 0.04),
          new THREE.Vector2(waist * 1.48, 0.42),
          new THREE.Vector2(waist * 1.06, 0.91),
        ],
        40,
      ).scale(1, 1, 0.82),
    ),
    materials.cloth,
  )
  coat.position.y = 0.01
  coat.name = 'manga-long-coat'
  figure.add(coat)
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-coat-folds', () => {
      const parts = [-1, 1].map((side) => {
        const shape = new THREE.Shape()
        shape.moveTo(side * 0.08, 0.88)
        shape.lineTo(side * 0.145, 0.44)
        shape.lineTo(side * 0.17, -0.085)
        shape.lineTo(side * 0.13, 0.18)
        shape.lineTo(side * 0.114, 0.51)
        shape.closePath()
        return new THREE.ShapeGeometry(shape).translate(0, 0, 0.151)
      })
      return mergeHumanDetails(parts)
    }),
    materials.dark.clone(),
  )
  ;(folds.material as import('three').MeshBasicMaterial).color.setHex(0x394654)
  folds.name = 'feitan-coat-folds'
  figure.add(folds)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `feitan-folded-shoulder-${side}`,
      points: [
        [side * 0.12, 1.39],
        [side * 0.184, 1.36],
        [side * 0.15, 1.31],
        [side * 0.134, 1.36],
      ],
      material: materials.dark,
    })
}

export function addFeitanBoots(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'feitan-portor') return
  const { THREE, geometry, glow } = build
  const shape = geometry(THREE, 'manga:feitan-soft-boot', () =>
    new THREE.SphereGeometry(1, 24, 14).scale(0.045, 0.036, 0.106).translate(0, -0.008, 0.015),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = shape
    })
    ;(shoe.children[1] as Mesh).material = glow(0x454b4b, 1)
    const ankle = new THREE.Mesh(
      geometry(THREE, 'manga:feitan-boot-wrinkles', () =>
        mergeHumanDetails(
          [0, 1, 2].map((i) =>
            new THREE.TorusGeometry(0.044 + (i % 2) * 0.004, 0.006, 6, 24)
              .rotateX(Math.PI / 2)
              .translate(0, -0.38 + i * 0.035, 0),
          ),
        ),
      ),
      glow(0x454b4b, 1),
    )
    ankle.name = 'feitan-boot-wrinkles'
    knee.add(ankle)
  }
}

import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaChestSurface, mangaPanel } from './mangaBody'
import { kurapikaPanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

function addVest(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist, depth } = mangaBodyShape(profile)
  ;(figure.getObjectByName('torso')!.children[1] as Mesh).material = materials.shirt
  const back = new THREE.Mesh(
    geometry(THREE, 'manga:luzurus-cropped-vest-back', () =>
      new THREE.LatheGeometry(
        [
          [waist * 1.14, 1.025],
          [waist * 1.15, 1.12],
          [chest * 1.04, 1.35],
          [chest * 0.85, 1.41],
          [0.082, 1.463],
        ].map(([r, y]) => new THREE.Vector2(r, y - 1.12)),
        40,
        0.4,
        Math.PI * 2 - 0.8,
      ).scale(1, 1, depth / chest),
    ),
    materials.cloth,
  )
  back.name = 'luzurus-cropped-vest-back'
  back.position.y = 1.12
  figure.add(back)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `luzurus-cropped-vest-${side}`,
      points: [
        [side * 0.065, 1.472],
        [side * 0.174, 1.386],
        [side * 0.177, 1.3],
        [side * 0.145, 1.025],
        [side * 0.041, 1.025],
        [side * 0.044, 1.385],
      ],
      material: materials.cloth,
      lift: 0.024,
    })
  const fringe = new THREE.Mesh(
    geometry(THREE, 'manga:luzurus-vest-fringe', () => {
      const parts = []
      for (const side of [-1, 1])
        for (let i = 0; i < 7; i++) {
          const x = side * (0.048 + i * 0.015),
            z = mangaChestSurface(profile, x, 1.025) + 0.026
          const bottom = -0.115 - (i % 3) * 0.01
          parts.push(
            kurapikaPanel(THREE, [
              [x - 0.006, 0.006, z],
              [x + 0.006, 0.006, z],
              [x + 0.008, bottom + 0.012, z + 0.012],
              [x, bottom, z + 0.014],
              [x - 0.007, bottom + 0.018, z + 0.012],
            ]),
          )
        }
      return mergeHumanDetails(parts)
    }),
    materials.cloth,
  )
  fringe.name = 'luzurus-vest-fringe'
  fringe.position.y = 1.025
  figure.add(fringe)
}

function addSash(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { waist, depth, chest } = mangaBodyShape(profile)
  const sash = new THREE.Mesh(
    geometry(THREE, 'manga:luzurus-wrapped-sash', () =>
      new THREE.CylinderGeometry(waist * 1.13, waist * 1.19, 0.147, 36).scale(1, 1, depth / chest),
    ),
    materials.shirt,
  )
  sash.name = 'luzurus-wrapped-sash'
  sash.position.y = 0.982
  figure.add(sash)
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:luzurus-sash-folds', () =>
      mergeHumanDetails(
        Array.from({ length: 4 }, (_, i) =>
          new THREE.TorusGeometry(waist * (1.145 + i * 0.013), 0.0017, 5, 36)
            .rotateX(Math.PI / 2)
            .scale(1, 1, depth / chest)
            .translate(0, 0.052 - i * 0.032, 0),
        ),
      ),
    ),
    materials.accent,
  )
  folds.name = 'luzurus-sash-folds'
  folds.position.y = 0.982
  figure.add(folds)
}

export function addLuzurusVest(build: HumanClothesBuild) {
  addVest(build)
  addSash(build)
  mangaPanel(build, {
    name: 'luzurus-open-shirt-neck',
    points: [
      [-0.044, 1.485],
      [-0.043, 1.445],
      [-0.013, 1.419],
      [0, 1.31],
      [0.013, 1.419],
      [0.043, 1.445],
      [0.044, 1.485],
    ],
    material: build.materials.skin!,
    lift: 0.015,
  })
}

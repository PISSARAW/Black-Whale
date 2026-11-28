import type { HumanClothesBuild } from './humanClothes'
import { addMangaSuit } from './mangaTailoring'
import { mangaPanel, mangaChestSurface, mangaBodyShape } from './mangaBody'
import { kurapikaSurfacePanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addHalkenburgPinstripeSuit(build: HumanClothesBuild) {
  addMangaSuit(build)
  const { THREE, geometry, figure, materials, profile } = build
  const stripes = new THREE.Mesh(
    geometry(THREE, 'manga:halkenburg-pinstripe-jacket', () => {
      const parts = []
      for (let i = -7; i <= 7; i++) {
        const x = i * 0.017
        const top = Math.abs(x) < 0.055 ? 1.12 : 1.35
        parts.push(
          kurapikaSurfacePanel(THREE, {
            points: [
              [x, 0.82, 0],
              [x + 0.0013, 0.82, 0],
              [x + 0.0013, top, 0],
              [x, top, 0],
            ],
            depth: (sx, y) => mangaChestSurface(profile, sx, y) + 0.014,
          }),
        )
      }
      return mergeHumanDetails(parts).translate(0, -1.12, 0)
    }),
    materials.accent,
  )
  stripes.name = 'halkenburg-pinstripe-suit'
  stripes.position.y = 1.12
  figure.add(stripes)
}

export function addBeyondRobe(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { waist } = mangaBodyShape(profile)
  const robe = new THREE.Mesh(
    geometry(THREE, 'manga:beyond-loose-robe', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(waist * 1.65, 0.23),
          new THREE.Vector2(waist * 1.45, 0.48),
          new THREE.Vector2(waist * 1.12, 0.93),
        ],
        32,
      ).scale(1, 1, 0.82),
    ),
    materials.cloth,
  )
  robe.name = 'beyond-loose-robe'
  figure.add(robe)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `beyond-robe-lapel-${side}`,
      points: [
        [side * 0.09, 1.47],
        [side * 0.14, 1.4],
        ...(side === 1
          ? ([
              [-0.12, 1.12],
              [-0.13, 1.15],
            ] as const)
          : ([
              [0, 1.3],
              [-0.035, 1.33],
            ] as const)),
      ],
      material: materials.shirt,
      lift: 0.018,
    })
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:beyond-robe-folds', () => {
      const parts = []
      for (let i = 0; i < 6; i++)
        parts.push(
          new THREE.TorusGeometry(waist * (1.22 + i * 0.055), 0.003, 5, 40, Math.PI)
            .rotateX(Math.PI / 2)
            .scale(1, 1, 0.85)
            .translate(0, 0.87 - i * 0.095, 0),
        )
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  folds.name = 'beyond-robe-folds'
  figure.add(folds)
}

export function addFurykovPuffer(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist, depth } = mangaBodyShape(profile)
  const prefix = profile.likeness === 'prince-benjamin' ? 'benjamin' : profile.likeness!
  mangaPanel(build, {
    name: `${prefix}-puffer-zipper`,
    points: [
      [-0.004, 1.49],
      [-0.004, 0.81],
      [0.004, 0.81],
      [0.004, 1.49],
    ],
    material: materials.accent,
  })
  const padding = new THREE.Mesh(
    geometry(THREE, `manga:${prefix}-puffer-seams`, () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(waist * 1.07, 0.0035, 6, 48)
          .rotateX(Math.PI / 2)
          .scale(1, 1, depth / chest)
          .translate(0, 0.08, 0),
        new THREE.TorusGeometry(waist * 1.03, 0.0035, 6, 48)
          .rotateX(Math.PI / 2)
          .scale(1, 1, depth / chest)
          .translate(0, -0.12, 0),
      ]),
    ),
    materials.accent,
  )
  padding.position.y = 1.12
  padding.name = `${prefix}-puffer-seams`
  figure.add(padding)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      `manga:${prefix}-puffer-collar`,
      () => new THREE.CylinderGeometry(chest * 0.38, chest * 0.44, 0.11, 24, 1, true),
    ),
    materials.cloth,
  )
  collar.position.y = 1.48
  collar.name = `${prefix}-puffer-collar`
  figure.add(collar)
}

/** Borksen's standard Kakin field jacket, read from the supplied manga close-up. */
export function addBorksenKakinUniform(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest } = mangaBodyShape(profile)
  mangaPanel(build, {
    name: 'borksen-uniform-zipper',
    points: [
      [-0.0045, 1.49],
      [-0.0045, 0.83],
      [0.0045, 0.83],
      [0.0045, 1.49],
    ],
    material: materials.accent,
    lift: 0.012,
  })
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `borksen-uniform-yoke-${side}`,
      points: [
        [side * 0.035, 1.45],
        [side * chest * 0.74, 1.39],
        [side * chest * 0.79, 1.34],
        [side * 0.05, 1.4],
      ],
      material: materials.accent,
      lift: 0.01,
    })
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:borksen-standing-collar',
      () => new THREE.CylinderGeometry(chest * 0.34, chest * 0.43, 0.12, 28, 1, true),
    ),
    materials.cloth,
  )
  collar.position.y = 1.485
  collar.name = 'borksen-standing-collar'
  figure.add(collar)
}

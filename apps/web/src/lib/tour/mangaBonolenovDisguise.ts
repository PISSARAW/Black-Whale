import type { HumanClothesBuild } from './humanClothes'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mangaPanel } from './mangaBody'

export function mangaFalseHisokaHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(
    new THREE.LatheGeometry(
      [
        [0.129, -0.118],
        [0.161, -0.061],
        [0.169, 0.044],
        [0.163, 0.125],
        [0.141, 0.181],
      ].map(([radius, height]) => new THREE.Vector2(radius, height)),
      32,
      0.91,
      Math.PI * 2 - 1.82,
    ).scale(1, 1, 0.98),
  )
  for (let i = -9; i <= 9; i++) {
    const x = i * 0.016
    const tip = -0.04 + Math.abs(x) * 0.13 + (i % 3) * 0.006
    kit.lock({
      width: 0.015,
      depth: 0.011,
      points: [
        [x * 0.54, 0.221, 0.018],
        [x * 0.99, 0.181, 0.138],
        [x * 1.12, 0.083, 0.176 - x * x],
        [x * 1.18 + 0.01, tip, 0.175 - Math.abs(x) * 0.36],
      ],
    })
  }
}

export function addFalseHisokaJacket(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials } = build
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:bonolenov-disguise-high-collar',
      () => new THREE.CylinderGeometry(0.076, 0.087, 0.104, 24),
    ),
    materials.cloth,
  )
  collar.name = 'bonolenov-disguise-high-collar'
  collar.position.y = 1.482 * frame.neck
  figure.add(collar)
  mangaPanel(build, {
    name: 'bonolenov-disguise-jacket-zip',
    points: [
      [-0.003, 0.83],
      [0.003, 0.83],
      [0.004, 1.49],
      [-0.004, 1.49],
    ],
    material: materials.shirt,
  })
  mangaPanel(build, {
    name: 'bonolenov-disguise-zip-pull',
    points: [
      [-0.012, 1.385],
      [0, 1.413],
      [0.012, 1.385],
      [0, 1.371],
    ],
    material: materials.accent,
    lift: 0.014,
  })
}

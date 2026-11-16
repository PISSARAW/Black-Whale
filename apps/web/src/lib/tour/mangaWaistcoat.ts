import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

/** User's shipboard reference: pale shirt, fitted waistcoat and dark shoulder yoke. */
export function addMangaWaistcoat(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `hisoka-shirt-collar-${side}`,
      points: [
        [side * 0.052, 1.49],
        [side * 0.004, 1.45],
        [side * 0.028, 1.37],
        [side * 0.076, 1.4],
      ],
      material: materials.shirt,
      lift: 0.009,
    })
    mangaPanel(build, {
      name: `hisoka-waistcoat-yoke-${side}`,
      points: [
        [side * 0.07, 1.47],
        [side * 0.19, 1.38],
        [side * 0.18, 1.32],
        [side * 0.075, 1.37],
      ],
      material: materials.dark,
      lift: 0.007,
    })
  }
  mangaPanel(build, {
    name: 'hisoka-waistcoat-opening',
    points: [
      [-0.066, 1.46],
      [0, 1.19],
      [0.066, 1.46],
    ],
    material: materials.shirt,
  })
  const trim = new THREE.Mesh(
    geometry(THREE, 'manga:hisoka-waistcoat-trim', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.009, 0.43, 0.008).translate(0, -0.08, 0.12),
        new THREE.TorusGeometry(0.039, 0.003, 6, 24, Math.PI)
          .rotateZ(Math.PI)
          .translate(0, 0.21, 0.113),
      ]),
    ),
    materials.accent,
  )
  trim.position.y = 1.12
  trim.name = 'hisoka-waistcoat-trim'
  figure.add(trim)
}

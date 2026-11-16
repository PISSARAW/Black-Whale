import type { HumanClothesBuild } from './humanClothes'
import { addMangaSuit } from './mangaTailoring'
import { mangaChestSurface, mangaClothesKey, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addBodyguardReferenceSuit(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  addMangaSuit(build)
  const badge = new THREE.Mesh(
    geometry(THREE, `manga:hunter-badge:${mangaClothesKey(profile)}`, () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.005, 0.025, 0.002).translate(-0.007, 0, 0),
        new THREE.BoxGeometry(0.005, 0.025, 0.002).translate(0.007, 0, 0),
        new THREE.BoxGeometry(0.014, 0.0045, 0.002),
      ]),
    ),
    materials.shirt,
  )
  badge.name = `${profile.likeness}-hunter-badge`
  badge.position.set(0.108, 1.315, mangaChestSurface(profile, 0.108, 1.315) + 0.018)
  figure.add(badge)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `${profile.likeness}-jacket-fold-${side}`,
      points: [
        [side * 0.09, 1.15],
        [side * 0.135, 1.18],
        [side * 0.11, 1.165],
        [side * 0.1, 1.155],
      ],
      material: materials.dark,
      lift: 0.018,
    })
}

import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel, mangaChestSurface } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaSuit } from './mangaTailoring'

export function addBiscuitReferenceClothes(build: HumanClothesBuild) {
  if (build.profile.frame === 'adult') addBiscuitAdultJacket(build)
  else addBiscuitRoyalBodyguardSuit(build)
}

function addBiscuitRoyalBodyguardSuit(build: HumanClothesBuild) {
  addMangaSuit(build)
  const { THREE, geometry, figure, materials } = build
  const jacketClosure = new THREE.Mesh(
    geometry(THREE, 'manga:biscuit-bodyguard-jacket-closure', () =>
      mergeHumanDetails([
        new THREE.SphereGeometry(0.006, 8, 6).scale(1, 1, 0.45).translate(0, 0.035, 0),
        new THREE.SphereGeometry(0.006, 8, 6).scale(1, 1, 0.45).translate(0, -0.035, 0),
      ]),
    ),
    materials.dark,
  )
  jacketClosure.position.set(0, 1.16, 0.135)
  jacketClosure.name = 'biscuit-royal-bodyguard-suit'
  figure.add(jacketClosure)
}

function addBiscuitAdultJacket(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  mangaPanel(build, {
    name: 'biscuit-true-form-abdomen',
    points: [
      [-0.1, 1.49],
      [-0.21, 1.24],
      [-0.17, 0.79],
      [0.17, 0.79],
      [0.21, 1.24],
      [0.1, 1.49],
    ],
    material: materials.skin ?? materials.shirt,
    lift: 0.02,
  })
  mangaPanel(build, {
    name: 'biscuit-true-form-crop-top',
    points: [
      [-0.13, 1.43],
      [-0.21, 1.28],
      [-0.18, 1.13],
      [0.18, 1.13],
      [0.21, 1.28],
      [0.13, 1.43],
      [0, 1.32],
    ],
    material: materials.shirt,
    lift: 0.035,
  })
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `biscuit-short-jacket-front-${side}`,
      points: [
        [side * 0.09, 1.48],
        [side * 0.24, 1.41],
        [side * 0.245, 1.28],
        [side * 0.205, 1.0],
        [side * 0.12, 1.0],
        [side * 0.13, 1.37],
      ],
      material: materials.cloth,
      lift: 0.045,
    })
  const abs = new THREE.Mesh(
    geometry(THREE, 'manga:biscuit-true-form-muscle-lines', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.18)
            .rotateZ(side * 0.09)
            .translate(side * 0.047, -0.09, mangaChestSurface(profile, side * 0.047, 1.03) + 0.024),
        )
        parts.push(
          new THREE.PlaneGeometry(0.08, 0.003)
            .rotateZ(side * 0.65)
            .translate(side * 0.075, -0.25, 0.16),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.accent,
  )
  abs.position.y = 1.12
  abs.name = 'biscuit-true-form-muscle-lines'
  figure.add(abs)
}

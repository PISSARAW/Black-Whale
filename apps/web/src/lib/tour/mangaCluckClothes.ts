import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { cluckPlumage, type CluckPlume } from './cluckFeathers'
import { mergeHumanDetails } from './humanDetailGeometry'
import { mangaChestSurface } from './mangaBody'

export function addCluckFeatherCostume(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  ;(figure.getObjectByName('torso')!.children[1] as Mesh).material =
    materials.skin ?? materials.shirt
  const bodice = new THREE.Mesh(
    geometry(THREE, 'manga:cluck-black-bodice', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.SphereGeometry(1, 24, 16)
            .scale(0.075, 0.067, 0.028)
            .translate(side * 0.073, 0.14, mangaChestSurface(profile, side * 0.073, 1.26) + 0.012),
        ),
      ),
    ),
    materials.cloth,
  )
  bodice.position.y = 1.12
  bodice.name = 'cluck-black-bodice'
  figure.add(bodice)
  const trim: CluckPlume[] = []
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++)
      trim.push({
        length: 0.095,
        width: 0.014,
        at: [side * (0.042 + i * 0.024), 0.18, 0.12 - i * 0.006],
        turn: [0, 0, side * -(0.15 + i * 0.27)],
      })
  const cupFeathers = cluckPlumage({
    THREE,
    geometry,
    key: 'cluck-bodice-feathers',
    plumes: trim,
    materials: { white: materials.shirt, teal: materials.accent, shaft: materials.dark },
  })
  cupFeathers.position.y = 1.12
  figure.add(cupFeathers)
  const choker = new THREE.Mesh(
    geometry(
      THREE,
      'manga:cluck-black-choker',
      () => new THREE.CylinderGeometry(0.05, 0.052, 0.043, 24),
    ),
    materials.cloth,
  )
  choker.position.y = 1.49
  choker.name = 'cluck-black-choker'
  figure.add(choker)
  const waist = new THREE.Mesh(
    geometry(THREE, 'manga:cluck-waist-ribbon', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.125, 0.008, 6, 32).rotateX(Math.PI / 2).scale(1, 1, 0.8),
        new THREE.TorusGeometry(0.021, 0.004, 6, 20)
          .scale(1.4, 0.65, 1)
          .translate(-0.026, -0.01, 0.108),
        new THREE.TorusGeometry(0.021, 0.004, 6, 20)
          .scale(1.4, 0.65, 1)
          .translate(0.026, -0.01, 0.108),
      ]),
    ),
    materials.cloth,
  )
  waist.position.y = 1.0
  waist.name = 'cluck-waist-ribbon'
  figure.add(waist)
  const plumes: CluckPlume[] = []
  for (let i = -4; i <= 4; i++)
    plumes.push({
      length: 0.89 + (4 - Math.abs(i)) * 0.025,
      width: 0.05,
      at: [i * 0.031, 0, -0.1],
      turn: [Math.PI - Math.abs(i) * 0.025, 0, i * 0.11],
    })
  const train = cluckPlumage({
    THREE,
    geometry,
    key: 'cluck-feather-train',
    plumes,
    materials: { white: materials.shirt, teal: materials.accent, shaft: materials.dark },
  })
  train.position.y = 0.85
  figure.add(train)
}

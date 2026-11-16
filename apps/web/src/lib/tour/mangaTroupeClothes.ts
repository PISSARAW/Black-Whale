import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'

export function addFranklinOveralls(build: HumanClothesBuild) {
  const { THREE, figure, geometry, materials } = build
  mangaPanel(build, {
    name: 'franklin-bare-chest',
    points: [
      [-0.12, 1.47],
      [-0.13, 1.3],
      [0.13, 1.3],
      [0.12, 1.47],
    ],
    material: materials.skin ?? materials.shirt,
  })
  mangaPanel(build, {
    name: 'franklin-overall-bib',
    points: [
      [-0.112, 1.34],
      [-0.13, 0.79],
      [0.13, 0.79],
      [0.112, 1.34],
    ],
    material: materials.shirt,
    lift: 0.009,
  })
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `franklin-overall-strap-${side}`,
      points: [
        [side * 0.126, 1.475],
        [side * 0.16, 1.45],
        [side * 0.124, 1.31],
        [side * 0.096, 1.32],
      ],
      material: materials.shirt,
      lift: 0.012,
    })
    mangaPanel(build, {
      name: `franklin-jacket-edge-${side}`,
      points: [
        [side * 0.17, 1.46],
        [side * 0.19, 1.42],
        [side * 0.145, 0.79],
        [side * 0.123, 0.79],
      ],
      material: materials.dark,
      lift: 0.015,
    })
  }
  mangaPanel(build, {
    name: 'franklin-overall-pocket',
    points: [
      [-0.07, 1.21],
      [-0.065, 1.085],
      [0.065, 1.085],
      [0.07, 1.21],
    ],
    material: materials.shirt,
    lift: 0.018,
  })
  const buckles = new THREE.Mesh(
    geometry(THREE, 'manga:franklin-overall-buckles', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.012, 0.004, 6, 16).translate(-0.14, 0.2, 0.145),
        new THREE.TorusGeometry(0.012, 0.004, 6, 16).translate(0.14, 0.2, 0.145),
      ]),
    ),
    materials.accent,
  )
  buckles.position.y = 1.12
  buckles.name = 'franklin-overall-buckles'
  figure.add(buckles)
}

export function addChrolloCrossCoat(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  mangaPanel(build, {
    name: 'chrollo-coat-front',
    points: [
      [-0.105, 1.46],
      [-0.12, 0.75],
      [0.12, 0.75],
      [0.105, 1.46],
    ],
    material: materials.shirt,
  })
  for (let band = 0; band < 3; band++)
    for (const side of [-1, 1]) {
      const y = 1.31 - band * 0.205
      mangaPanel(build, {
        name: `chrollo-coat-cross-${band}-${side}`,
        points: [
          [-0.115, y + side * 0.045],
          [-0.115, y + side * 0.045 - 0.022],
          [0.115, y - side * 0.045 - 0.022],
          [0.115, y - side * 0.045],
        ],
        material: materials.accent,
        lift: 0.024,
      })
    }
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:chrollo-high-collar',
      () => new THREE.CylinderGeometry(0.105, 0.12, 0.11, 28),
    ),
    materials.shirt,
  )
  collar.position.y = 1.45
  collar.name = 'chrollo-high-collar'
  figure.add(collar)
  const coat = new THREE.Mesh(
    geometry(THREE, 'manga:chrollo-long-cross-coat', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.21, 0.15),
          new THREE.Vector2(0.19, 0.45),
          new THREE.Vector2(0.145, 0.85),
        ],
        32,
      ).scale(1, 1, 0.78),
    ),
    materials.cloth,
  )
  coat.name = 'chrollo-long-cross-coat'
  figure.add(coat)
  const lowerFront = new THREE.Mesh(
    geometry(THREE, 'manga:chrollo-coat-lower-front', () =>
      kurapikaPanel(THREE, [
        [-0.12, 0.85, 0.115],
        [-0.135, 0.15, 0.161],
        [0.135, 0.15, 0.161],
        [0.12, 0.85, 0.115],
      ]),
    ),
    materials.shirt,
  )
  figure.add(lowerFront)
  const lowerCross = new THREE.Mesh(
    geometry(THREE, 'manga:chrollo-lower-coat-crosses', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.32, 0.021).rotateZ(0.35).translate(0, 0.6, 0.146),
        new THREE.PlaneGeometry(0.32, 0.021).rotateZ(-0.35).translate(0, 0.6, 0.146),
        new THREE.PlaneGeometry(0.35, 0.021).rotateZ(-0.3).translate(0, 0.28, 0.166),
      ]),
    ),
    materials.accent,
  )
  lowerCross.name = 'chrollo-lower-coat-crosses'
  figure.add(lowerCross)
}

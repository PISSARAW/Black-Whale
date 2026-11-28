import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaPanel, mangaChestSurface } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel } from './kurapikaGeometry'

export function addHinrighStripedJacket(build: HumanClothesBuild) {
  const { THREE, figure, geometry, materials, profile } = build
  const stripes = new THREE.Mesh(
    geometry(THREE, 'manga:hinrigh-jacket-stripes', () => {
      const parts = []
      for (const side of [-1, 1])
        for (let band = 0; band < 3; band++) {
          const x = side * (0.055 + band * 0.05)
          parts.push(
            kurapikaSurfacePanel(THREE, {
              points: [
                [x, 0.74, 0],
                [x + 0.023, 0.74, 0],
                [x + 0.023, 1.405, 0],
                [x, 1.405, 0],
              ],
              depth: (sx, y) => mangaChestSurface(profile, sx, y) + 0.015,
            }),
          )
        }
      return mergeHumanDetails(parts).translate(0, -1.12, 0)
    }),
    materials.dark,
  )
  stripes.position.y = 1.12
  stripes.name = 'hinrigh-wide-jacket-stripes'
  figure.add(stripes)
  mangaPanel(build, {
    name: 'hinrigh-open-chest',
    points: [
      [-0.063, 1.49],
      [-0.07, 1.35],
      [0, 1.12],
      [0.07, 1.35],
      [0.063, 1.49],
    ],
    material: materials.skin ?? materials.shirt,
    lift: 0.024,
  })
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `hinrigh-dark-lapel-${side}`,
      points: [
        [side * 0.066, 1.47],
        [side * 0.145, 1.37],
        [side * 0.09, 1.3],
        [side * 0.12, 1.27],
        [0, 1.075],
        [side * 0.055, 1.32],
      ],
      material: materials.dark,
      lift: 0.03,
    })
  const { waist } = mangaBodyShape(profile)
  const tail = new THREE.Mesh(
    geometry(THREE, 'manga:hinrigh-jacket-tail', () =>
      new THREE.CylinderGeometry(waist * 0.99, waist * 1.12, 0.23, 32)
        .scale(1, 1, 0.8)
        .translate(0, -0.005, 0),
    ),
    materials.cloth,
  )
  tail.position.y = 0.7
  tail.name = 'hinrigh-jacket-tail'
  figure.add(tail)
  const tailStripes = new THREE.Mesh(
    geometry(THREE, 'manga:hinrigh-tail-stripes', () => {
      const parts = []
      for (const side of [-1, 1])
        for (const band of [0, 1]) {
          const x = side * (0.055 + band * 0.05)
          parts.push(
            kurapikaSurfacePanel(THREE, {
              points: [
                [x, -0.12, 0],
                [x + 0.023, -0.12, 0],
                [x + 0.023, 0.1, 0],
                [x, 0.1, 0],
              ],
              depth: (sx) => Math.sqrt(Math.max(0, (waist * 1.08) ** 2 - sx ** 2)) * 0.8 + 0.006,
            }),
          )
        }
      return mergeHumanDetails(parts)
    }),
    materials.dark,
  )
  tailStripes.position.y = 0.7
  figure.add(tailStripes)
  for (let i = 0; i < 3; i++) {
    const button = new THREE.Mesh(
      geometry(THREE, 'manga:hinrigh-jacket-button', () =>
        new THREE.SphereGeometry(0.007, 10, 8).scale(1, 1, 0.5),
      ),
      materials.dark,
    )
    button.position.set(
      0.01,
      0.83 + i * 0.095,
      mangaChestSurface(profile, 0.01, 0.83 + i * 0.095) + 0.025,
    )
    figure.add(button)
  }
}

export function addZakuroCroppedJacket(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `zakuro-jacket-frame-${side}`,
      points: [
        [side * 0.035, 1.47],
        [side * 0.17, 1.39],
        [side * 0.16, 1.355],
        [side * 0.024, 1.435],
        [side * 0.024, 0.995],
        [side * 0.12, 0.995],
        [side * 0.12, 0.965],
        [side * 0.006, 0.965],
        [side * 0.006, 1.45],
      ],
      material: materials.shirt,
      lift: 0.02,
    })
    mangaPanel(build, {
      name: `zakuro-chest-piping-${side}`,
      points: [
        [side * 0.02, 1.315],
        [side * 0.137, 1.35],
        [side * 0.145, 1.333],
        [side * 0.02, 1.301],
      ],
      material: materials.shirt,
      lift: 0.022,
    })
  }
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:zakuro-high-collar',
      () => new THREE.CylinderGeometry(0.068, 0.08, 0.09, 24, 1, true),
    ),
    materials.shirt,
  )
  collar.position.y = 1.47
  collar.name = 'zakuro-high-collar'
  figure.add(collar)
  const { waist } = mangaBodyShape(profile)
  const waistBand = new THREE.Mesh(
    geometry(THREE, 'manga:zakuro-cropped-waist', () =>
      new THREE.CylinderGeometry(waist * 1.12, waist * 1.13, 0.14, 28).scale(1, 1, 0.8),
    ),
    materials.shirt,
  )
  waistBand.position.y = 0.895
  waistBand.name = 'zakuro-cropped-waist'
  figure.add(waistBand)
  for (let i = 0; i < 3; i++) {
    const y = 1.31 - i * 0.1
    const button = new THREE.Mesh(
      geometry(THREE, 'manga:zakuro-round-button', () =>
        new THREE.SphereGeometry(0.014, 16, 8).scale(1, 1, 0.32),
      ),
      materials.shirt,
    )
    button.position.set(0, y, mangaChestSurface(profile, 0, y) + 0.025)
    button.name = 'zakuro-round-button'
    figure.add(button)
  }
}

export function addTerebellumSportsJacket(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  mangaPanel(build, {
    name: 'terebellum-jacket-zipper',
    points: [
      [-0.006, 1.46],
      [-0.006, 0.81],
      [0.006, 0.81],
      [0.006, 1.46],
    ],
    material: materials.shirt,
  })
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `terebellum-shoulder-piping-${side}`,
      points: [
        [side * 0.06, 1.47],
        [side * 0.23, 1.38],
        [side * 0.23, 1.35],
        [side * 0.06, 1.44],
      ],
      material: materials.shirt,
    })
    mangaPanel(build, {
      name: `terebellum-chest-piping-${side}`,
      points: [
        [side * 0.008, 1.24],
        [side * 0.072, 1.28],
        [side * 0.133, 1.36],
        [side * 0.145, 1.405],
        [side * 0.188, 1.386],
        [side * 0.174, 1.329],
        [side * 0.085, 1.24],
        [side * 0.008, 1.2],
      ],
      material: materials.shirt,
    })
    mangaPanel(build, {
      name: `terebellum-jacket-pocket-${side}`,
      points: [
        [side * 0.15, 1.05],
        [side * 0.1, 0.91],
        [side * 0.115, 0.9],
        [side * 0.165, 1.04],
      ],
      material: materials.shirt,
    })
  }
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:terebellum-sport-collar',
      () => new THREE.CylinderGeometry(0.083, 0.102, 0.065, 24, 1, true),
    ),
    materials.shirt,
  )
  collar.position.y = 1.47
  figure.add(collar)
}

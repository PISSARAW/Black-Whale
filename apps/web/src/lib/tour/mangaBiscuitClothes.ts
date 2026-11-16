import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaPanel, mangaChestSurface } from './mangaBody'
import { kurapikaSurfacePanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addBiscuitReferenceClothes(build: HumanClothesBuild) {
  if (build.profile.frame === 'adult') addBiscuitAdultJacket(build)
  else addBiscuitOrnateDress(build)
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

function addBiscuitOrnateDress(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials, profile } = build
  const { waist } = mangaBodyShape(profile)
  const skirt = new THREE.Mesh(
    geometry(
      THREE,
      'manga:biscuit-petal-skirt',
      () =>
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0, 0.16),
            new THREE.Vector2(waist * 2.8, 0.16),
            new THREE.Vector2(waist * 2.7, 0.28),
            new THREE.Vector2(waist * 1.7, 0.65),
            new THREE.Vector2(waist, 0.98),
          ],
          40,
        ),
    ),
    materials.cloth,
  )
  skirt.position.y = 0
  skirt.name = 'biscuit-petal-skirt'
  figure.add(skirt)
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `biscuit-ornate-bolero-${side}`,
      points: [
        [side * 0.065, 1.47],
        [side * 0.18, 1.38],
        [side * 0.12, 1.13],
        [side * 0.01, 1.1],
        [side * 0.03, 1.33],
      ],
      material: materials.dark,
      lift: 0.02,
    })
    mangaPanel(build, {
      name: `biscuit-pale-lapel-${side}`,
      points: [
        [side * 0.05, 1.47],
        [side * 0.13, 1.39],
        [side * 0.07, 1.2],
        [0, 1.37],
      ],
      material: materials.shirt,
      lift: 0.035,
    })
  }
  const petals = new THREE.Mesh(
    geometry(THREE, 'manga:biscuit-dress-petals', () => {
      const parts = []
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const shape = new THREE.Shape()
        shape.moveTo(0, 0.94)
        shape.quadraticCurveTo(-0.13, 0.65, -0.11, 0.26)
        shape.quadraticCurveTo(0, 0.13, 0.11, 0.26)
        shape.quadraticCurveTo(0.13, 0.65, 0, 0.94)
        const petal = kurapikaSurfacePanel(THREE, {
          points: shape.getPoints(6).map((point) => [point.x, point.y, 0] as const),
          depth: (x, y) => {
            const radius = waist * (1 + (Math.max(0, 0.98 - y) / 0.82) * 1.8)
            return Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) + 0.012
          },
        })
        parts.push(petal.rotateY(a))
      }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  petals.name = 'biscuit-dress-petals'
  figure.add(petals)
  const collar = new THREE.Mesh(
    geometry(THREE, 'manga:biscuit-frill-collar', () => {
      const parts = []
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        parts.push(
          new THREE.SphereGeometry(1, 10, 8)
            .scale(0.027, 0.013, 0.036)
            .translate(Math.cos(a) * 0.073, 0, Math.sin(a) * 0.065),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.dark,
  )
  collar.position.y = 1.45 * frame.neck
  collar.name = 'biscuit-frill-collar'
  figure.add(collar)
}

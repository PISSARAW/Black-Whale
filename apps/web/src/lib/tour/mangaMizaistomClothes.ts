import type { BufferGeometry } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { cowSpotContour } from './mangaCowSpots'
import { mangaPanel, mangaBodyShape } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

const SPOTS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [-0.25, 1.38],
    [-0.12, 1.45],
    [-0.04, 1.32],
    [-0.13, 1.22],
    [-0.24, 1.26],
  ],
  [
    [0.09, 1.46],
    [0.25, 1.38],
    [0.23, 1.15],
    [0.14, 1.19],
    [0.06, 1.3],
  ],
  [
    [-0.09, 1.2],
    [0.01, 1.25],
    [0.1, 1.16],
    [0.07, 1.04],
    [-0.02, 0.97],
    [-0.11, 1.05],
  ],
  [
    [-0.2, 0.96],
    [-0.12, 1.02],
    [-0.08, 0.85],
    [-0.16, 0.76],
    [-0.22, 0.83],
  ],
]

export function addMizaistomCowUniform(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  SPOTS.forEach((points, i) =>
    mangaPanel(build, {
      name: `mizaistom-cow-spot-${i}`,
      points: cowSpotContour(points),
      material: materials.dark,
      lift: 0.018,
    }),
  )
  mangaPanel(build, {
    name: 'mizaistom-uniform-zipper',
    points: [
      [-0.004, 1.49],
      [-0.004, 0.78],
      [0.004, 0.78],
      [0.004, 1.49],
    ],
    material: materials.accent,
    lift: 0.025,
  })
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:mizaistom-high-collar',
      () => new THREE.CylinderGeometry(0.078, 0.097, 0.1, 32, 1, true),
    ),
    materials.cloth,
  )
  collar.position.y = 1.465
  collar.name = 'mizaistom-high-collar'
  figure.add(collar)
  const { waist } = mangaBodyShape(profile)
  const hem = new THREE.Mesh(
    geometry(THREE, 'manga:mizaistom-jacket-hem', () =>
      new THREE.CylinderGeometry(waist * 1.12, waist * 1.15, 0.16, 32).scale(1, 1, 0.8),
    ),
    materials.cloth,
  )
  hem.position.y = 0.765
  hem.name = 'mizaistom-jacket-hem'
  figure.add(hem)
}

function limbSpots(build: HumanLimbsBuild, radius: number): BufferGeometry {
  const { THREE } = build
  const parts = []
  for (let i = 0; i < 3; i++)
    parts.push(
      new THREE.SphereGeometry(1, 16, 12)
        .scale(radius * 0.77, 0.07 + (i % 2) * 0.035, 0.012)
        .rotateZ(i % 2 ? 0.3 : -0.2)
        .translate(
          i % 2 ? -0.018 : 0.015,
          -0.055 - i * 0.115,
          i === 1 ? -radius * 0.9 : radius * 0.91,
        ),
    )
  return mergeHumanDetails(parts)
}

export function addMizaistomCowLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'mizaistom-nana') return
  const { THREE, geometry, glow } = build
  for (let i = 0; i < 2; i++) {
    for (const [joint, radius] of [
      [limbs.arms[i], 0.071],
      [limbs.elbows[i], 0.055],
      [limbs.legs[i], 0.103],
      [limbs.knees[i], 0.075],
    ] as const) {
      const spots = new THREE.Mesh(
        geometry(THREE, `manga:mizaistom-limb-spots:${radius}`, () => limbSpots(build, radius)),
        glow(0x202023, 1),
      )
      spots.name = 'mizaistom-limb-spots'
      joint.add(spots)
    }
  }
}

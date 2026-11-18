import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel, mangaBodyShape } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

function addRobeSkirt(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  const skirt = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-long-light-robe', () =>
      new THREE.LatheGeometry(
        [
          [0.284, 0.29],
          [0.292, 0.34],
          [0.277, 0.65],
          [0.266, 0.91],
        ].map(([r, y]) => new THREE.Vector2(r, y - 0.75)),
        40,
      ).scale(1, 1, 0.79),
    ),
    materials.cloth,
  )
  skirt.name = 'salesale-long-light-robe'
  skirt.position.y = 0.75
  figure.add(skirt)
  const hem = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-robe-hem', () =>
      new THREE.TorusGeometry(0.286, 0.002, 5, 40).rotateX(Math.PI / 2).scale(1, 1, 0.79),
    ),
    materials.accent,
  )
  hem.name = 'salesale-robe-hem'
  hem.position.y = 0.3
  figure.add(hem)
}

function addBelt(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { depth, chest } = mangaBodyShape(profile)
  const belt = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-cloth-belt', () =>
      new THREE.CylinderGeometry(0.282, 0.277, 0.073, 40).scale(1, 1, depth / chest),
    ),
    materials.shirt,
  )
  belt.name = 'salesale-cloth-belt'
  belt.position.y = 1.018
  figure.add(belt)
  const knot = new THREE.Mesh(
    geometry(THREE, 'manga:salesale-belt-knot', () =>
      mergeHumanDetails([
        new THREE.SphereGeometry(1, 16, 10).scale(0.024, 0.027, 0.012),
        new THREE.BoxGeometry(0.026, 0.13, 0.008).rotateZ(0.15).translate(-0.013, -0.07, 0),
        new THREE.BoxGeometry(0.025, 0.11, 0.008).rotateZ(-0.17).translate(0.014, -0.062, 0.002),
      ]),
    ),
    materials.shirt,
  )
  knot.name = 'salesale-belt-knot'
  knot.position.set(0.08, 1.014, 0.22)
  figure.add(knot)
}

export function addSalesaleRobe(build: HumanClothesBuild) {
  addRobeSkirt(build)
  addBelt(build)
  mangaPanel(build, {
    name: 'salesale-inner-robe',
    material: build.materials.shirt,
    points: [
      [-0.075, 1.455],
      [-0.086, 1.39],
      [0.16, 1.05],
      [0.205, 1.11],
      [0.065, 1.455],
    ],
    lift: 0.011,
  })
  mangaPanel(build, {
    name: 'salesale-wrapped-lapel',
    material: build.materials.shirt,
    points: [
      [0.065, 1.455],
      [0.094, 1.41],
      [-0.145, 1.05],
      [-0.188, 1.09],
      [-0.064, 1.455],
    ],
    lift: 0.015,
  })
  mangaPanel(build, {
    name: 'salesale-open-neckline',
    material: build.materials.skin!,
    points: [
      [-0.07, 1.52],
      [-0.047, 1.43],
      [0, 1.35],
      [0.052, 1.445],
      [0.07, 1.52],
    ],
    lift: 0.019,
  })
}

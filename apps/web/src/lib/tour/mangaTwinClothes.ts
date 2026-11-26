import type { Group } from 'three'
import type { HumanLimbsBuild } from './humanLimbs'
import { CANON } from './humanProportions'
import type { HumanClothesBuild } from './humanClothes'
import { mangaChestSurface, mangaPanel } from './mangaBody'
import { addMangaDress } from './mangaRobes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock } from './kurapikaGeometry'

export function addKachoCeremonialDress(build: HumanClothesBuild): void {
  if (build.profile.royalCostume === 'twins-banquet') return addTwinBanquetDress(build)
  addMangaDress(build, 0.045)
  const { THREE, figure, geometry, materials, frame, profile } = build
  const bow = new THREE.Mesh(
    geometry(THREE, 'manga:kacho-chest-ribbon', () =>
      mergeHumanDetails([
        ...[-1, 1].flatMap((side) => [
          new THREE.SphereGeometry(1, 18, 10)
            .scale(0.079, 0.038, 0.026)
            .rotateZ(side * 0.28)
            .translate(side * 0.07, 0.016, 0),
          kurapikaLock(THREE, {
            width: 0.024,
            depth: 0.006,
            points: [
              [side * 0.017, -0.007, 0.003],
              [side * 0.029, -0.045, 0.01],
              [side * 0.046, -0.115, -0.007],
            ],
          }),
        ]),
        new THREE.SphereGeometry(1, 14, 8).scale(0.031, 0.028, 0.032),
      ]),
    ),
    materials.accent,
  )
  bow.position.set(0, 1.28 * frame.neck, mangaChestSurface(profile, 0, 1.28 * frame.neck) + 0.018)
  bow.name = 'kacho-chest-ribbon'
  figure.add(bow)

  const necklace = new THREE.Mesh(
    geometry(THREE, 'manga:kacho-ceremonial-necklace', () =>
      mergeHumanDetails([
        ...Array.from({ length: 13 }, (_, i) => {
          const angle = (i / 12) * Math.PI
          return new THREE.SphereGeometry(0.007, 8, 6).translate(
            Math.cos(angle) * 0.071,
            -Math.sin(angle) * 0.035,
            Math.sin(angle) * 0.042,
          )
        }),
        new THREE.SphereGeometry(0.016, 6, 3).scale(0.7, 1, 0.6).translate(0, -0.048, 0.05),
      ]),
    ),
    materials.shirt,
  )
  necklace.name = 'kacho-ceremonial-necklace'
  necklace.position.set(0, 1.464 * frame.neck, 0.063)
  figure.add(necklace)
}

export function addFugetsuClothes(build: HumanClothesBuild): void {
  if (build.profile.royalCostume === 'twins-banquet') return addTwinBanquetDress(build)
  if (build.profile.royalCostume === 'fugetsu-night') return addFugetsuNightwear(build)
  const { materials } = build
  mangaPanel(build, {
    name: 'fugetsu-waistcoat-shirt',
    points: [
      [-0.072, 1.469],
      [-0.12, 1.416],
      [-0.073, 1.285],
      [0, 1.19],
      [0.073, 1.285],
      [0.12, 1.416],
      [0.072, 1.469],
    ],
    material: materials.shirt,
  })
  mangaPanel(build, {
    name: 'fugetsu-tie',
    points: [
      [-0.016, 1.443],
      [0.016, 1.443],
      [0.009, 1.405],
      [0.018, 1.259],
      [0, 1.223],
      [-0.018, 1.259],
      [-0.009, 1.405],
    ],
    material: materials.accent,
    lift: 0.021,
  })
  addTwinCollar(build)
  const { THREE, figure, geometry, profile, frame } = build
  for (let i = 0; i < 3; i++) {
    const y = (1.17 - i * 0.048) * frame.neck
    const button = new THREE.Mesh(
      geometry(
        THREE,
        'manga:fugetsu-waistcoat-button',
        () => new THREE.SphereGeometry(0.008, 8, 6),
      ),
      materials.accent,
    )
    button.name = 'fugetsu-waistcoat-button'
    button.position.set(0, y, mangaChestSurface(profile, 0, y) + 0.006)
    figure.add(button)
  }
}

function addFugetsuNightwear(build: HumanClothesBuild): void {
  addTwinCollar(build)
  const { materials } = build
  mangaPanel(build, {
    name: 'fugetsu-pajama-placket',
    points: [
      [-0.008, 1.44],
      [-0.008, 0.97],
      [0.008, 0.97],
      [0.008, 1.44],
    ],
    material: materials.shirt,
  })
}

function addTwinCollar(build: HumanClothesBuild): void {
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `twins-turned-collar-${side}`,
      points: [
        [side * 0.041, 1.473],
        [side * 0.008, 1.445],
        [side * 0.049, 1.404],
        [side * 0.076, 1.457],
      ],
      material: build.materials.shirt,
      lift: 0.024,
    })
}

function addTwinBanquetDress(build: HumanClothesBuild): void {
  addMangaDress(build, 0.37)
  const { THREE, figure, geometry, materials, profile, frame } = build
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:twins-banquet-collar',
      () => new THREE.CylinderGeometry(0.054, 0.064, 0.047, 24, 1, true),
    ),
    materials.cloth,
  )
  collar.name = 'twins-banquet-standing-collar'
  collar.position.y = 1.48 * frame.neck
  figure.add(collar)
  for (const [i, height] of [1.235, 1.175].entries())
    mangaPanel(build, {
      name: `twins-banquet-chevron-${i}`,
      points: [
        [-0.133, height],
        [0, height - 0.081],
        [0.133, height],
        [0.133, height - 0.027],
        [0, height - 0.116],
        [-0.133, height - 0.027],
      ],
      material: materials.accent,
    })
  const pin = new THREE.Mesh(
    geometry(THREE, 'manga:twins-banquet-pin', () => new THREE.BoxGeometry(0.031, 0.044, 0.009)),
    materials.accent,
  )
  const y = 1.31 * frame.neck
  pin.name = 'twins-banquet-pin'
  pin.position.set(0.066, y, mangaChestSurface(profile, 0.066, y) + 0.011)
  figure.add(pin)
}

export function addBanquetSleeveBands(build: HumanLimbsBuild, arm: Group): void {
  const { THREE, geometry, glow, profile } = build
  const bands = new THREE.Mesh(
    geometry(THREE, 'manga:twins-banquet-sleeve-bands', () =>
      mergeHumanDetails(
        [0.057, 0.074].map((offset) =>
          new THREE.CylinderGeometry(0.048, 0.048, 0.007, 16)
            .scale(0.86, 1, 0.86)
            .translate(0, -CANON.upperArm + offset, 0),
        ),
      ),
    ),
    glow(profile.accent, 1),
  )
  bands.name = 'twins-banquet-sleeve-bands'
  arm.add(bands)
}

import type { BufferGeometry } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaChestSurface, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addQuorolleCoat(build: HumanClothesBuild) {
  const { materials } = build
  mangaPanel(build, {
    name: 'quorolle-open-neck',
    material: materials.skin ?? materials.shirt,
    points: [
      [-0.079, 1.479],
      [0.079, 1.479],
      [0.053, 1.35],
      [0.004, 1.267],
      [-0.032, 1.326],
    ],
  })
  coatCollar(build, 'quorolle-high-collar')
  addCoatSkirt(build, 'quorolle-split-coat', 0.45)
  addQuorolleBelt(build)
  mangaPanel(build, {
    name: 'quorolle-placket',
    material: materials.accent,
    lift: 0.015,
    points: [
      [0.004, 1.285],
      [0.021, 1.306],
      [0.017, 0.955],
      [-0.002, 0.952],
    ],
  })
}

export function addTevelaresJacket(build: HumanClothesBuild) {
  const { materials } = build
  mangaPanel(build, {
    name: 'tevelares-light-shirt',
    material: materials.shirt,
    points: [
      [-0.085, 1.475],
      [0.081, 1.475],
      [0.048, 1.26],
      [0.013, 1.05],
      [-0.037, 1.18],
    ],
  })
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `tevelares-turned-lapel-${side}`,
      material: materials.accent,
      lift: 0.021,
      points: [
        [side * 0.065, 1.476],
        [side * 0.118, 1.422],
        [side * 0.089, 1.359],
        [side * 0.121, 1.371],
        [side * 0.026, 1.163],
        [side * 0.061, 1.37],
      ],
    })
  }
  addCoatSkirt(build, 'tevelares-jacket-hem', 0.63)
  addTevelaresBackTab(build)
}

function coatCollar(build: HumanClothesBuild, name: string) {
  const { THREE, geometry, materials, figure } = build
  const collar = new THREE.Mesh(
    geometry(THREE, `manga:${name}`, () =>
      new THREE.LatheGeometry(
        [
          [0.112, 1.413],
          [0.098, 1.493],
          [0.123, 1.547],
        ].map(([radius, y]) => new THREE.Vector2(radius, y)),
        28,
        0.69,
        Math.PI * 2 - 1.38,
      ).scale(1, 1, 0.85),
    ),
    materials.cloth,
  )
  collar.name = name
  figure.add(collar)
}

function addCoatSkirt(build: HumanClothesBuild, name: string, bottom: number) {
  const { THREE, figure, geometry, materials, profile } = build
  const { waist, chest, depth } = mangaBodyShape(profile)
  const skirt = new THREE.Mesh(
    geometry(THREE, `manga:${name}`, () => {
      const frontGap = bottom < 0.5 ? 0.36 : 0.09
      return new THREE.LatheGeometry(
        [
          [waist * 1.68, bottom],
          [waist * 1.5, (bottom + 0.91) / 2],
          [waist * 1.05, 0.96],
        ].map(([radius, y]) => new THREE.Vector2(radius, y)),
        34,
        frontGap,
        Math.PI * 2 - frontGap * 2,
      ).scale(1, 1, Math.max(0.72, depth / chest))
    }),
    materials.cloth,
  )
  skirt.name = name
  figure.add(skirt)
}

function addQuorolleBelt(build: HumanClothesBuild) {
  const { THREE, figure, geometry, materials, profile } = build
  const { waist } = mangaBodyShape(profile)
  const y = 0.962
  const z = mangaChestSurface(profile, 0, y) + 0.022
  const belt = new THREE.Mesh(
    geometry(THREE, 'manga:quorolle-waist-belt', () =>
      new THREE.CylinderGeometry(waist * 1.11, waist * 1.13, 0.033, 28, 1, true).scale(1, 1, 0.78),
    ),
    materials.accent,
  )
  belt.name = 'quorolle-waist-belt'
  belt.position.y = y
  figure.add(belt)
  const buckle = new THREE.Mesh(
    geometry(THREE, 'manga:quorolle-belt-buckle', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.048, 0.007, 0.009).translate(0, 0.016, 0),
        new THREE.BoxGeometry(0.048, 0.007, 0.009).translate(0, -0.016, 0),
        new THREE.BoxGeometry(0.007, 0.029, 0.009).translate(-0.021, 0, 0),
        new THREE.BoxGeometry(0.007, 0.029, 0.009).translate(0.021, 0, 0),
      ]),
    ),
    materials.shirt,
  )
  buckle.name = 'quorolle-belt-buckle'
  buckle.position.set(0.016, y, z)
  figure.add(buckle)
  const strap = new THREE.Mesh(
    geometry(THREE, 'manga:quorolle-belt-strap', () =>
      new THREE.BoxGeometry(0.021, 0.215, 0.009).rotateZ(0.23),
    ),
    materials.accent,
  )
  strap.name = 'quorolle-belt-strap'
  strap.position.set(0.095, 0.854, z + 0.012)
  figure.add(strap)
}

function addTevelaresBackTab(build: HumanClothesBuild) {
  const { THREE, figure, geometry, materials, profile } = build
  const tab = new THREE.Mesh(
    geometry(THREE, 'manga:tevelares-back-waist-tab', () =>
      new THREE.CapsuleGeometry(0.015, 0.132, 4, 12).rotateZ(Math.PI / 2),
    ),
    materials.accent,
  )
  tab.name = 'tevelares-back-waist-tab'
  tab.position.set(0, 0.952, -mangaChestSurface(profile, 0, 0.952) - 0.021)
  figure.add(tab)
}

export function addHeillyRaidBoots(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const id = profile.likeness
  if (id !== 'quorolle' && id !== 'tevelares') return
  for (const knee of limbs.knees) {
    const shaft = new THREE.Mesh(
      geometry(THREE, `manga:${id}-boot-shaft`, () => raidBootGeometry(build, id === 'quorolle')),
      glow(0x363435, 1),
    )
    shaft.name = `${id}-boot-shaft`
    knee.add(shaft)
    const trousers = new THREE.Mesh(
      geometry(THREE, `manga:${id}-trouser-folds`, () => trouserFolds(build)),
      glow(profile.trousers, 1),
    )
    trousers.name = `${id}-trouser-folds`
    knee.add(trousers)
  }
}

function raidBootGeometry(build: HumanLimbsBuild, tall: boolean): BufferGeometry {
  const { THREE } = build
  const top = tall ? -0.285 : -0.335
  return new THREE.LatheGeometry(
    [
      [0.049, -0.461],
      [0.055, -0.411],
      [0.068, top - 0.025],
      [0.067, top],
    ].map(([radius, y]) => new THREE.Vector2(radius, y)),
    22,
  ).scale(1, 1, 0.95)
}

function trouserFolds(build: HumanLimbsBuild) {
  const { THREE } = build
  return mergeHumanDetails(
    [0, 1, 2].map((i) =>
      new THREE.TorusGeometry(0.061 + i * 0.004, 0.009, 7, 18)
        .rotateX(Math.PI / 2)
        .rotateZ(i % 2 ? 0.14 : -0.16)
        .translate(0, -0.245 + i * 0.037, 0.006),
    ),
  )
}

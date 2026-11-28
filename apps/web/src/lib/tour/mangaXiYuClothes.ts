import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaPanel, mangaBodyShape } from './mangaBody'

export function addLynchTop(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile, frame } = build
  mangaPanel(build, {
    name: 'lynch-vest-neckline',
    points: [
      [-0.057, 1.49],
      [0.057, 1.49],
      [0.085, 1.36],
      [0.068, 1.3],
      [-0.067, 1.3],
      [-0.086, 1.36],
    ],
    material: materials.skin ?? materials.shirt,
    lift: 0.009,
  })
  const { waist } = mangaBodyShape(profile)
  const waistband = new THREE.Mesh(
    geometry(THREE, 'manga:lynch-cropped-top-band', () =>
      new THREE.CylinderGeometry(waist * 1.01, waist * 1.08, 0.054, 28).scale(1, 1, 0.77),
    ),
    materials.accent,
  )
  waistband.position.y = 0.92 * frame.neck
  waistband.name = 'lynch-cropped-top-band'
  figure.add(waistband)
}

export function addVoconteJacket(build: HumanClothesBuild) {
  const { materials } = build
  mangaPanel(build, {
    name: 'voconte-layered-shirt',
    points: [
      [-0.052, 1.47],
      [0, 1.419],
      [0.052, 1.47],
      [0.075, 1.32],
      [0.05, 0.84],
      [-0.05, 0.84],
      [-0.075, 1.32],
    ],
    material: materials.accent,
  })
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `voconte-open-collar-${side}`,
      points: [
        [side * 0.058, 1.48],
        [side * 0.117, 1.42],
        [side * 0.105, 1.34],
        [side * 0.072, 1.355],
        [side * 0.052, 1.23],
        [side * 0.018, 1.411],
      ],
      material: materials.shirt,
      lift: 0.012,
    })
}

export function shapeLynchLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const skin = glow(profile.skin, 1)
  const cloth = glow(profile.trousers, 1)
  const cuffGeometry = geometry(
    THREE,
    'manga:lynch-pant-cuff',
    () => new THREE.CylinderGeometry(0.066, 0.052, 0.045, 24),
  )
  for (let i = 0; i < limbs.legs.length; i++) {
    for (const joint of [limbs.arms[i], limbs.elbows[i], limbs.knees[i]])
      (joint.children[0].children[1] as Mesh).material = skin
    ;(limbs.arms[i].children[2].children[1] as Mesh).material = skin
    const thigh = limbs.legs[i].children[0]
    thigh.scale.x *= 1.37
    thigh.scale.z *= 1.29
    const pant = new THREE.Mesh(
      geometry(THREE, 'manga:lynch-cropped-pant-leg', () =>
        new THREE.LatheGeometry(
          [
            [0.055, -0.235],
            [0.072, -0.202],
            [0.089, -0.092],
            [0.076, 0.02],
          ].map(([r, y]) => new THREE.Vector2(r, y)),
          24,
        ).scale(1, 1, 0.91),
      ),
      cloth,
    )
    pant.name = 'lynch-cropped-pant-leg'
    const cuff = new THREE.Mesh(cuffGeometry, cloth)
    cuff.position.y = -0.221
    limbs.knees[i].add(pant, cuff)
  }
}

import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addCleapatroEgyptianHeaddress(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    eye?.scale.set(1.18, 0.62, 1)
    if (brow) brow.visible = false
    const thinBrow = new THREE.Mesh(
      geometry(
        THREE,
        'manga:cleapatro-thin-long-brow',
        () => new THREE.PlaneGeometry(0.088, 0.0045),
      ),
      materials.hairInk,
    )
    thinBrow.name = 'cleapatro-thin-long-brow'
    thinBrow.position.set(side * 0.075, 0.078, 0.18)
    thinBrow.rotation.z = side * -0.13
    head.add(thinBrow)

    const sidePanel = new THREE.Mesh(
      geometry(THREE, 'manga:cleapatro-headdress-side-panel', () =>
        new THREE.BoxGeometry(0.075, 0.31, 0.045).rotateZ(side * -0.08),
      ),
      materials.hairInk,
    )
    sidePanel.name = 'cleapatro-egyptian-side-panel'
    sidePanel.position.set(side * 0.162, -0.025, -0.01)
    head.add(sidePanel)
  }

  const band = new THREE.Mesh(
    geometry(
      THREE,
      'manga:cleapatro-headdress-band',
      () => new THREE.BoxGeometry(0.32, 0.062, 0.045),
    ),
    materials.hairInk,
  )
  band.name = 'cleapatro-straight-headdress-band'
  band.position.set(0, 0.17, 0.035)
  head.add(band)

  const striations = new THREE.Mesh(
    geometry(THREE, 'manga:cleapatro-headdress-striations', () => {
      const parts: BufferGeometry[] = []
      for (let line = -6; line <= 6; line++)
        parts.push(new THREE.PlaneGeometry(0.002, 0.052).translate(line * 0.022, 0.17, 0.061))
      for (const side of [-1, 1])
        for (let line = 0; line < 4; line++)
          parts.push(
            new THREE.PlaneGeometry(0.002, 0.25)
              .rotateZ(side * -0.08)
              .translate(side * (0.137 + line * 0.017), -0.028, 0.015),
          )
      return mergeHumanDetails(parts)
    }),
    glow(0xd5c7ac, 0.76),
  )
  striations.name = 'cleapatro-headdress-striations'
  head.add(striations)
}

export function addCleapatroStripedUniform(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest } = mangaBodyShape(profile)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:cleapatro-high-collar',
      () => new THREE.CylinderGeometry(chest * 0.31, chest * 0.42, 0.16, 26, 1, true),
    ),
    materials.shirt,
  )
  collar.name = 'cleapatro-light-high-collar'
  collar.position.y = 1.47
  figure.add(collar)

  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `cleapatro-black-chest-stripe-${side}`,
      points: [
        [side * 0.055, 1.44],
        [side * chest * 0.78, 1.31],
        [side * chest * 0.74, 1.24],
        [side * 0.04, 1.38],
      ],
      material: materials.dark,
      lift: 0.016,
    })
    mangaPanel(build, {
      name: `cleapatro-black-waist-stripe-${side}`,
      points: [
        [side * 0.02, 1.04],
        [side * 0.17, 0.94],
        [side * 0.17, 0.88],
        [side * 0.02, 0.98],
      ],
      material: materials.dark,
      lift: 0.014,
    })
  }
}

export function addCleapatroSleeveStripes(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow, profile } = build
  for (const arm of limbs.arms) {
    const stripe = new THREE.Mesh(
      geometry(
        THREE,
        'manga:cleapatro-sleeve-stripe',
        () => new THREE.CylinderGeometry(0.061, 0.061, 0.075, 18),
      ),
      glow(profile.trousers, 1),
    )
    stripe.name = 'cleapatro-black-sleeve-stripe'
    stripe.position.y = -0.08
    arm.add(stripe)
  }
}

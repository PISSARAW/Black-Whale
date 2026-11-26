import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

function pinstripes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const lines = geometry(THREE, 'manga:halkenburg-limb-stripes', () =>
    mergeHumanDetails(
      [-2, -1, 0, 1, 2].map((i) =>
        new THREE.PlaneGeometry(0.0012, 0.3).translate(i * 0.019, -0.18, 0.064),
      ),
    ),
  )
  for (let i = 0; i < 2; i++) {
    for (const joint of [limbs.arms[i], limbs.elbows[i], limbs.legs[i], limbs.knees[i]])
      joint.add(new THREE.Mesh(lines, glow(profile.accent, 1)))
  }
}

function furykov(build: HumanLimbsBuild, limbs: HumanLimbs, fullness = 1) {
  const { THREE, geometry, glow } = build
  for (let i = 0; i < 2; i++) {
    limbs.arms[i].children[0].scale.x *= 1 + 0.4 * fullness
    limbs.elbows[i].children[0].scale.x *= 1 + 0.4 * fullness
    limbs.legs[i].children[0].scale.x *= 1 + 0.5 * fullness
    limbs.knees[i].children[0].scale.x *= 1 + 0.35 * fullness
    const boot = new THREE.Mesh(
      geometry(
        THREE,
        'manga:furykov-tall-boot',
        () => new THREE.CylinderGeometry(0.058, 0.062, 0.24, 24),
      ),
      glow(0x252629, 1),
    )
    boot.position.y = -0.335
    boot.name = 'furykov-tall-boot'
    limbs.knees[i].add(boot)
    const laces = new THREE.Mesh(
      geometry(THREE, 'manga:furykov-boot-laces', () => {
        const parts = []
        for (let lace = 0; lace < 8; lace++)
          parts.push(
            new THREE.PlaneGeometry(0.035, 0.003)
              .rotateZ(lace % 2 ? 0.3 : -0.3)
              .translate(0, -0.235 - lace * 0.026, 0.063),
          )
        return mergeHumanDetails(parts)
      }),
      glow(0xb9b6aa, 1),
    )
    limbs.knees[i].add(laces)
    ;(limbs.knees[i].children[1].children[1] as Mesh).material = glow(0x252629, 1)
  }
}

export function addRoyalMilitaryLimbDetails(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness === 'prince-halkenburg') pinstripes(build, limbs)
  if (['otocin', 'momolly', 'gipper', 'maizan'].includes(build.profile.likeness ?? ''))
    furykov(build, limbs, 0.55)
  if (['furykov', 'prince-benjamin', 'rihan'].includes(build.profile.likeness ?? ''))
    furykov(build, limbs)
}

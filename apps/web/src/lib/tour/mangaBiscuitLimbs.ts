import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addBiscuitLimbClothes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'biscuit-krueger' || build.profile.frame === 'adult') return
  const { THREE, geometry, glow, profile } = build
  const puff = geometry(THREE, 'manga:biscuit-puff-sleeve', () =>
    new THREE.SphereGeometry(1, 20, 14).scale(0.078, 0.14, 0.073),
  )
  const frill = geometry(THREE, 'manga:biscuit-sleeve-frill', () => {
    const parts = []
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      parts.push(
        new THREE.ConeGeometry(0.022, 0.065, 8)
          .scale(1, 1, 0.6)
          .rotateZ(Math.PI)
          .translate(Math.cos(a) * 0.066, -0.2, Math.sin(a) * 0.066),
      )
    }
    return mergeHumanDetails(parts)
  })
  for (let i = 0; i < 2; i++) {
    limbs.arms[i].children[0].scale.y *= 0.5
    const sleeve = new THREE.Mesh(puff, glow(profile.shirt, 1))
    sleeve.position.y = -0.065
    sleeve.name = 'biscuit-puff-sleeve'
    limbs.arms[i].add(sleeve)
    const lace = new THREE.Mesh(frill, glow(profile.shirt, 1))
    lace.name = 'biscuit-sleeve-frill'
    limbs.arms[i].add(lace)
    ;(limbs.elbows[i].children[0].children[1] as import('three').Mesh).material = glow(
      profile.skin,
      1,
    )
  }
}

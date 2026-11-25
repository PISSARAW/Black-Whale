import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'

export function addBiscuitLimbClothes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'biscuit-krueger' || build.profile.frame === 'adult') return
  const { THREE, geometry, glow, profile } = build
  const cuff = geometry(
    THREE,
    'manga:biscuit-bodyguard-cuff',
    () => new THREE.CylinderGeometry(0.057, 0.057, 0.026, 16, 1, true),
  )
  for (let i = 0; i < 2; i++) {
    const sleeveCuff = new THREE.Mesh(cuff, glow(profile.shirt, 1))
    sleeveCuff.position.y = -0.2
    sleeveCuff.name = 'biscuit-bodyguard-cuff'
    limbs.arms[i].add(sleeveCuff)
  }
}

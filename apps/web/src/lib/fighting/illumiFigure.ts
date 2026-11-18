import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'
import type { ArcadeFighter } from './types'

/** Physical face and skin alteration; the collision body and combat values stay identical. */
export function illumiFaceProfile(profile: HumanProfile, fighter: ArcadeFighter): HumanProfile {
  if (!fighter.illumi?.disguised || fighter.illumiMask) return profile
  return { ...profile, face: 'round', expression: 'neutral', skin: 0xb5aa97, hairStyle: 'short' }
}

export function addIllumiNeedles(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  fighter: ArcadeFighter
  model: HumanFigure
}): void {
  const { THREE, glow, fighter, model } = options
  const face = model.root.getObjectByName('face-mouth')?.parent
  if (!face) return
  const count = needleCount(fighter)
  if (!count) return
  const metal = glow(0xd5dce2, 1)
  const gold = glow(0xe1c154, 1)
  const shaft = new THREE.CylinderGeometry(0.007, 0.007, 0.18, 5)
  const cap = new THREE.SphereGeometry(0.023, 6, 5)
  for (let index = 0; index < count; index++) {
    const pin = new THREE.Group()
    pin.name = 'illumi-physical-needle'
    const needle = new THREE.Mesh(shaft, metal)
    needle.rotation.x = Math.PI / 2
    const head = new THREE.Mesh(cap, gold)
    head.position.z = 0.09
    pin.add(needle, head)
    pin.position.set(
      count === 1 ? 0.04 : Math.sin(index * 2.4) * 0.13,
      count === 1 ? 0.12 : Math.cos(index * 2.4) * 0.12,
      0.23,
    )
    face.add(pin)
  }
}

function needleCount(fighter: ArcadeFighter): number {
  if (fighter.illumiMask) return 0
  if (fighter.illumi?.disguised) return 7
  return fighter.needlePuppet?.needleEmbedded ? 1 : 0
}

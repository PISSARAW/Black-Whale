import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'
import type { ArcadeFighter } from './types'

export function illumiFigureKey(fighter: ArcadeFighter) {
  return [
    Boolean(fighter.illumi?.disguised),
    fighter.illumi?.disguiseMode,
    fighter.needleFace,
    fighter.illumiDisguisePins,
  ]
}

/** Physical face and skin alteration; the collision body and combat values stay identical. */
export function illumiFaceProfile(profile: HumanProfile, fighter: ArcadeFighter): HumanProfile {
  if (fighter.needleFace?.reshaping) return { ...profile, face: 'round', expression: 'anxious' }
  if (!fighter.illumi?.disguised) return profile
  if (fighter.illumi.disguiseMode === 'unpinned-hisoka') return { ...profile, faceLike: 'hisoka' }
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
  const markers = needleMarkers(fighter)
  if (!markers.length) return
  const metal = glow(0xd5dce2, 1)
  const gold = glow(0xe1c154, 1)
  const shaft = new THREE.CylinderGeometry(0.007, 0.007, 0.18, 5)
  const cap = new THREE.SphereGeometry(0.023, 6, 5)
  for (const marker of markers) {
    const pin = new THREE.Group()
    pin.name = marker.name
    const needle = new THREE.Mesh(shaft, metal)
    needle.rotation.x = Math.PI / 2
    const head = new THREE.Mesh(cap, gold)
    head.position.z = 0.09
    pin.add(needle, head)
    pin.position.set(marker.x, marker.y, 0.23)
    face.add(pin)
  }
}

function needleMarkers(fighter: ArcadeFighter) {
  const pinned =
    fighter.illumiDisguisePins ||
    (fighter.illumi?.disguised && fighter.illumi.disguiseMode !== 'unpinned-hisoka')
  const marks = Array.from({ length: pinned ? 7 : 0 }, (_, index) => ({
    name: 'illumi-physical-needle',
    x: Math.sin(index * 2.4) * 0.13,
    y: Math.cos(index * 2.4) * 0.12,
  }))
  if (fighter.needlePuppet?.needleEmbedded)
    marks.push({ name: 'illumi-physical-needle', x: 0.04, y: 0.12 })
  for (const index of fighter.needleFace?.needles.keys() ?? [])
    marks.push({ name: 'illumi-face-warp-needle', x: (index - 1) * 0.07, y: 0.13 })
  return marks
}

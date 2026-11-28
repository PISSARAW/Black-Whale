import type { BufferGeometry, Group, Material, Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

type Three = HumanFigureBuild['THREE']
const SCALED_HANDS = new WeakMap<BufferGeometry, Map<string, BufferGeometry>>()

/**
 * Fight-only roster finish grown from the Kurapika/Hisoka vertical slice.
 *
 * The shared tour rig remains untouched: these pieces are mounted on the live
 * combat joints, so hands, cuffs and facial accents follow every authored pose.
 * Hero-specific tailoring stays authored; extremity readability is proportional
 * to every fighter's declared frame and build.
 */
export function addFightRosterFinish(options: {
  THREE: Three
  model: HumanFigure
  profile: HumanProfile
}): void {
  const { THREE, model, profile } = options
  const id = profile.likeness
  if (!id || model.root.getObjectByName('fight-roster-finish')) return

  const finish = new THREE.Group()
  finish.name = 'fight-roster-finish'
  finish.userData.finishTier = id === 'kurapika' || id === 'hisoka' ? 'hero' : 'roster'
  model.turns.add(finish)
  refineExtremities({ THREE, root: model.root, profile, finish })
  if (id === 'kurapika') finishKurapika({ THREE, model, profile, finish })
}

function material(THREE: Three, colour: number): Material {
  return new THREE.MeshBasicMaterial({ color: colour, toneMapped: false })
}

function refineExtremities(options: {
  THREE: Three
  root: Object3D
  profile: HumanProfile
  finish: Group
}): void {
  const { THREE, root, profile, finish } = options
  const ink = material(THREE, 0x171318)
  for (const side of ['left', 'right'] as const) {
    const hand = root.getObjectByName(`hand-${side}`)
    if (hand) {
      const scale = extremityScale(profile)
      // Franklin's ten physical finger rigs are themselves held children and
      // were authored against the scaled wrist; every ordinary hand is baked.
      if (profile.likeness === 'franklin-bordeau') hand.scale.multiplyScalar(scale)
      else scaleHandGeometry(hand as Mesh, scale)
      const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.061 * scale, 0.004, 0.006), ink)
      knuckles.name = `fight-hand-knuckles-${side}`
      knuckles.position.set(0, 0.014, 0.029)
      hand.add(knuckles)
      finish.userData.extremityDetails = (finish.userData.extremityDetails ?? 0) + 1
    }
    const shoe = root.getObjectByName(`foot-${side}`)
    if (shoe) shoe.scale.multiply(new THREE.Vector3(1.015, 1.01, 1.025))
  }
}

/** Preserve chains and held equipment: visual mass belongs to skin geometry, never the joint. */
function scaleHandGeometry(hand: Mesh, scale: number): void {
  const source = hand.geometry
  const baked = hand.scale.clone().multiplyScalar(scale)
  const key = baked.toArray().join(':')
  let variants = SCALED_HANDS.get(source)
  if (!variants) {
    variants = new Map()
    SCALED_HANDS.set(source, variants)
  }
  let geometry = variants.get(key)
  if (!geometry) {
    geometry = source.clone().scale(baked.x, baked.y, baked.z)
    geometry.userData = {
      ...geometry.userData,
      sharedHuman: true,
      fightExtremityScale: scale,
      bakedHandScale: baked.toArray(),
    }
    variants.set(key, geometry)
  }
  hand.geometry = geometry
  const thumb = hand.children.find((child) => (child as Mesh).isMesh)
  thumb?.scale.multiply(baked)
  hand.scale.set(1, 1, 1)
}

function extremityScale(profile: HumanProfile): number {
  if (profile.likeness === 'hisoka') return 1.06
  if (profile.likeness === 'kurapika') return 1.045
  if (profile.frame !== 'adult') return 1.02
  return { slim: 1.025, average: 1.035, broad: 1.05 }[profile.build]
}

function finishKurapika(options: {
  THREE: Three
  model: HumanFigure
  profile: HumanProfile
  finish: Group
}): void {
  const { THREE, model, profile, finish } = options
  // A restrained charcoal edge separates the black jacket's construction at
  // gameplay distance without changing Kurapika's canonical palette.
  const seam = material(THREE, lighten(profile.jacket, 0.16))
  for (const side of [-1, 1]) {
    const torsoSeam = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.4, 0.006), seam)
    torsoSeam.name = side < 0 ? 'kurapika-jacket-seam-left' : 'kurapika-jacket-seam-right'
    torsoSeam.position.set(side * 0.105, 1.085, 0.113)
    torsoSeam.rotation.z = side * -0.035
    finish.add(torsoSeam)
  }
  const hair = model.root.getObjectByName('kurapika-head')?.getObjectByName('kurapika-layered-bob')
  if (hair) hair.scale.y *= 1.035
  const head = model.root.getObjectByName('kurapika-head')
  if (head) {
    for (const side of [-1, 1]) {
      const lowerLid = new THREE.Mesh(new THREE.BoxGeometry(0.047, 0.005, 0.004), seam)
      lowerLid.name = side < 0 ? 'kurapika-lower-lid-left' : 'kurapika-lower-lid-right'
      lowerLid.position.set(side * 0.067, -0.026, 0.126)
      lowerLid.rotation.z = side * 0.06
      head.add(lowerLid)
    }
  }
}

function lighten(colour: number, amount: number): number {
  const channel = (value: number) => Math.round(value + (255 - value) * amount)
  return (
    (channel((colour >> 16) & 0xff) << 16) |
    (channel((colour >> 8) & 0xff) << 8) |
    channel(colour & 0xff)
  )
}

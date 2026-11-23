import type { Group, Material, Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

type Three = HumanFigureBuild['THREE']

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
  refineExtremities(THREE, model.root, profile, finish)
  if (id === 'hisoka') finishHisoka(THREE, model, profile, finish)
  else if (id === 'kurapika') finishKurapika(THREE, model, profile, finish)
}

function material(THREE: Three, colour: number): Material {
  return new THREE.MeshBasicMaterial({ color: colour, toneMapped: false })
}

function refineExtremities(
  THREE: Three,
  root: Object3D,
  profile: HumanProfile,
  finish: Group,
): void {
  const ink = material(THREE, 0x171318)
  for (const side of ['left', 'right'] as const) {
    const hand = root.getObjectByName(`hand-${side}`)
    if (hand) {
      const scale = extremityScale(profile)
      hand.scale.multiplyScalar(scale)
      const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.061 * scale, 0.004, 0.006), ink)
      knuckles.name = `fight-hand-knuckles-${side}`
      knuckles.position.set(0, 0.014, 0.029)
      hand.add(knuckles)
      finish.userData.extremityDetails = (finish.userData.extremityDetails ?? 0) + 1
    }
    const shoe = root.getObjectByName(`knee-${side}`)?.children[1]
    if (shoe) shoe.scale.multiply(new THREE.Vector3(1.04, 1.02, 1.06))
  }
}

function extremityScale(profile: HumanProfile): number {
  if (profile.likeness === 'hisoka') return 1.14
  if (profile.likeness === 'kurapika') return 1.1
  if (profile.frame !== 'adult') return 1.06
  return { slim: 1.08, average: 1.1, broad: 1.12 }[profile.build]
}

function finishHisoka(
  THREE: Three,
  model: HumanFigure,
  profile: HumanProfile,
  finish: Group,
): void {
  // Deep side planes and bright fasteners give the existing fitted waistcoat
  // enough value separation to survive gameplay distance and fast movement.
  const vest = material(THREE, darken(profile.jacket, 0.72))
  const piping = material(THREE, darken(profile.jacket, 0.42))
  const pale = material(THREE, profile.shirt)
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      panelGeometry(THREE, [
        [side * 0.018, 1.43],
        [side * 0.155, 1.38],
        [side * 0.145, 0.91],
        [side * 0.02, 0.91],
        [side * 0.014, 1.17],
      ]),
      vest,
    )
    panel.name = side < 0 ? 'hisoka-waistcoat-left' : 'hisoka-waistcoat-right'
    panel.position.z = 0.153
    finish.add(panel)

    const shoulder = model.root.getObjectByName(side < 0 ? 'shoulder-left' : 'shoulder-right')
    if (shoulder) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.069, 0.07, 12), piping)
      cap.name = side < 0 ? 'hisoka-shoulder-panel-left' : 'hisoka-shoulder-panel-right'
      cap.position.y = -0.035
      shoulder.add(cap)
    }
    const elbow = model.root.getObjectByName(side < 0 ? 'elbow-left' : 'elbow-right')
    if (elbow) {
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.044, 0.055, 12), piping)
      cuff.name = side < 0 ? 'hisoka-wrist-cuff-left' : 'hisoka-wrist-cuff-right'
      cuff.position.y = -0.244
      elbow.add(cuff)
    }
  }
  for (let index = 0; index < 4; index++) {
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 6), pale)
    button.name = `hisoka-waistcoat-button-${index}`
    button.position.set(
      index % 2 === 0 ? -0.022 : 0.022,
      1.23 - Math.floor(index / 2) * 0.13,
      0.164,
    )
    button.scale.z = 0.45
    finish.add(button)
  }

  const head = model.root.getObjectByName('manga-head:hisoka')
  const hair = head?.getObjectByName('manga-layered-hair')
  if (head) head.scale.x *= 0.96
  if (hair) hair.scale.y *= 1.07
  if (head) {
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.075, 0.004), piping)
    nose.name = 'hisoka-nose-bridge'
    nose.position.set(-0.006, -0.036, 0.177)
    nose.rotation.z = -0.08
    head.add(nose)
    const lowerLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.054, 0.006, 0.004),
      material(THREE, 0x6f304f),
    )
    lowerLip.name = 'hisoka-lower-lip'
    lowerLip.position.set(0, -0.119, 0.173)
    head.add(lowerLip)
  }
}

function finishKurapika(
  THREE: Three,
  model: HumanFigure,
  profile: HumanProfile,
  finish: Group,
): void {
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

function panelGeometry(THREE: Three, points: ReadonlyArray<readonly [number, number]>) {
  const shape = new THREE.Shape()
  shape.moveTo(points[0][0], points[0][1])
  for (const [x, y] of points.slice(1)) shape.lineTo(x, y)
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

function darken(colour: number, amount: number): number {
  const r = ((colour >> 16) & 0xff) * amount
  const g = ((colour >> 8) & 0xff) * amount
  const b = (colour & 0xff) * amount
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)
}

function lighten(colour: number, amount: number): number {
  const channel = (value: number) => Math.round(value + (255 - value) * amount)
  return (
    (channel((colour >> 16) & 0xff) << 16) |
    (channel((colour >> 8) & 0xff) << 8) |
    channel(colour & 0xff)
  )
}

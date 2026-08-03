import type { BufferGeometry, Group, Material, MeshBasicMaterial } from 'three'
import { addSilentMajorityMask } from './humanCostume'
import type { HumanLook } from './humanFigure'

/** Ink, the one colour the head shares with the rest of the figure. */
const INK = 0x171318
import type { HumanProfile } from './humanProfiles'

type Three = typeof import('three')

/**
 * The head is built apart from the rest of the body because it is where all the
 * variation lives: face shape, hair, eyes, and the Silent Majority mask are
 * decided per passenger, while the torso and limbs are the same model scaled.
 * Together they made one builder too long to hold in mind.
 */
export interface HumanHeadBuild {
  THREE: Three
  geometry: (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry
  outlined: (shape: {
    THREE: Three
    geometry: BufferGeometry
    material: Material
    ink: Material
    scale?: number
  }) => Group
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  profile: HumanProfile
  seen: HumanLook
  materials: { ink: Material; skin: Material; hairInk: Material }
}

export function buildHumanHead({
  THREE,
  geometry,
  outlined,
  glow,
  profile,
  seen,
  materials,
}: HumanHeadBuild): Group {
  const { ink, skin, hairInk } = materials
  const head = new THREE.Group()
  head.position.y = 1.72
  const skull = outlined({
    THREE,
    geometry: geometry(THREE, 'skull', () => new THREE.SphereGeometry(0.19, 10, 8)),
    material: skin,
    ink,
  })
  skull.scale.set(
    profile.face === 'narrow' ? 0.82 : profile.face === 'square' ? 0.98 : 0.9,
    profile.face === 'round' ? 1.02 : 1.12,
    0.94,
  )
  head.add(skull)

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      geometry(THREE, 'eye', () => new THREE.PlaneGeometry(0.055, 0.014)),
      ink,
    )
    eye.name =
      seen.human?.role === 'morena'
        ? side < 0
          ? 'face-eye-base-left'
          : 'face-eye-base-right'
        : side < 0
          ? 'face-eye-left'
          : 'face-eye-right'
    eye.visible = seen.human?.role !== 'morena'
    eye.position.set(side * 0.062, 0.018, 0.181)
    eye.scale.y = profile.expression === 'tired' ? 0.65 : profile.expression === 'anxious' ? 1.4 : 1
    eye.rotation.z =
      profile.expression === 'hostile' || profile.expression === 'severe'
        ? side * -0.2
        : profile.expression === 'anxious'
          ? side * 0.1
          : side * -0.08
    head.add(eye)
    const brow = new THREE.Mesh(
      geometry(THREE, 'brow', () => new THREE.PlaneGeometry(0.064, 0.009)),
      ink,
    )
    brow.name =
      seen.human?.role === 'morena'
        ? side < 0
          ? 'face-brow-base-left'
          : 'face-brow-base-right'
        : side < 0
          ? 'face-brow-left'
          : 'face-brow-right'
    brow.visible = seen.human?.role !== 'morena'
    brow.position.set(side * 0.064, 0.06, 0.176)
    brow.scale.y = profile.expression === 'severe' ? 1.8 : 1
    brow.rotation.z =
      profile.expression === 'hostile'
        ? side * -0.28
        : profile.expression === 'anxious'
          ? side * 0.2
          : side * -0.12
    head.add(brow)
    const ear = new THREE.Mesh(
      geometry(THREE, 'ear', () => new THREE.SphereGeometry(0.035, 6, 4)),
      skin,
    )
    ear.scale.y = 1.35
    ear.position.x = side * 0.185
    head.add(ear)
  }
  const nose = new THREE.Mesh(
    geometry(THREE, 'nose', () => new THREE.ConeGeometry(0.022, 0.065, 4)),
    skin,
  )
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, -0.018, 0.195)
  head.add(nose)
  const mouth = new THREE.Mesh(
    geometry(THREE, 'mouth', () => new THREE.PlaneGeometry(0.07, 0.01)),
    ink,
  )
  mouth.position.set(0, -0.09, 0.178)
  mouth.name = seen.human?.role === 'morena' ? 'face-mouth-base' : 'face-mouth'
  mouth.visible = seen.human?.role !== 'morena'
  head.add(mouth)
  const jawShade = new THREE.Mesh(
    geometry(THREE, 'face:jaw-shadow', () => new THREE.PlaneGeometry(0.14, 0.045)),
    glow(INK, 0.18),
  )
  jawShade.position.set(0, -0.145, 0.135)
  jawShade.rotation.x = -0.5
  head.add(jawShade)

  if (profile.hairStyle !== 'shaved') {
    const hair = outlined({
      THREE,
      geometry: geometry(
        THREE,
        'hair',
        () => new THREE.SphereGeometry(0.196, 9, 5, 0, Math.PI * 2, 0, 1.18),
      ),
      material: hairInk,
      ink,
      scale: 1.025,
    })
    hair.scale.set(0.94, profile.hairStyle === 'military' ? 0.86 : 1.08, 0.98)
    hair.position.y = profile.hairStyle === 'military' ? 0.035 : 0.015
    head.add(hair)

    if (profile.hairStyle === 'spiked') {
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(
          geometry(THREE, 'hair:spike', () => new THREE.ConeGeometry(0.045, 0.18, 4)),
          hairInk,
        )
        spike.position.set(i * 0.065, 0.2 + Math.abs(i) * -0.015, -0.01)
        spike.rotation.z = i * -0.13
        head.add(spike)
      }
    } else if (profile.hairStyle === 'long' || profile.hairStyle === 'ponytail') {
      const fall = new THREE.Mesh(
        geometry(THREE, 'hair:fall', () => new THREE.CylinderGeometry(0.12, 0.09, 0.48, 6)),
        hairInk,
      )
      fall.position.set(0, -0.16, -0.13)
      head.add(fall)
      if (profile.hairStyle === 'ponytail') {
        const tail = new THREE.Mesh(
          geometry(THREE, 'hair:tail', () => new THREE.ConeGeometry(0.075, 0.42, 6)),
          hairInk,
        )
        tail.position.set(0, -0.18, -0.25)
        tail.rotation.x = -0.35
        head.add(tail)
      }
    } else if (profile.hairStyle === 'swept') {
      const fringe = new THREE.Mesh(
        geometry(THREE, 'hair:fringe', () => new THREE.ConeGeometry(0.075, 0.3, 4)),
        hairInk,
      )
      fringe.position.set(-0.09, 0.08, 0.14)
      fringe.rotation.z = -0.55
      head.add(fringe)
    } else if (profile.hairStyle === 'bob') {
      for (const side of [-1, 1]) {
        const sideHair = new THREE.Mesh(
          geometry(THREE, 'hair:bob-side', () => new THREE.BoxGeometry(0.13, 0.38, 0.18)),
          hairInk,
        )
        sideHair.position.set(side * 0.145, -0.04, -0.005)
        sideHair.rotation.z = side * -0.08
        head.add(sideHair)
      }
    }
  }

  if (seen.human?.role === 'silent-majority') {
    addSilentMajorityMask({ THREE, geometry, glow, ink, head })
  }
  return head
}

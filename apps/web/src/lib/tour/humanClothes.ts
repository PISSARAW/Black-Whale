import type { Group, Material } from 'three'
import type { Geometry, Three } from './silentMajorityParts'
import type { FrameShape, HumanProfile } from './humanProfiles'
import { addGarmentDetails } from './humanGarmentDetails'
import { addDeclaredGarments } from './mangaGarments'

export interface HumanClothesBuild {
  THREE: Three
  geometry: Geometry
  figure: Group
  profile: HumanProfile
  frame: FrameShape
  width: number
  shoulder: number
  materials: {
    cloth: Material
    shirt: Material
    dark: Material
    accent: Material
    ink: Material
    skin?: Material
  }
}

/** Shared clothing, attached above the waist so Fighting can articulate it. */
export function addHumanClothes(build: HumanClothesBuild): void {
  if (addDeclaredGarments(build)) return
  const { THREE, geometry, figure, profile, frame, width, shoulder, materials } = build
  const { cloth, shirt, dark, accent } = materials
  const shirtFront = new THREE.Mesh(
    geometry(THREE, 'clothes:shirt', () => new THREE.PlaneGeometry(0.16, 0.28)),
    shirt,
  )
  shirtFront.position.set(0, 1.19, 0.165)
  figure.add(shirtFront)
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(
      geometry(THREE, 'clothes:lapel', () => new THREE.PlaneGeometry(0.1, 0.3)),
      cloth,
    )
    lapel.position.set(side * 0.075, 1.23, 0.175)
    lapel.rotation.z = side * -0.28
    figure.add(lapel)
  }
  const belt = new THREE.Mesh(
    geometry(THREE, 'clothes:belt', () => new THREE.BoxGeometry(0.39, 0.045, 0.24)),
    dark,
  )
  belt.position.y = 0.82 * frame.neck
  belt.scale.x = 0.9 * width
  figure.add(belt)
  if (profile.clothing === 'suit') {
    const tie = new THREE.Mesh(
      geometry(THREE, 'clothes:tie', () => new THREE.ConeGeometry(0.035, 0.25, 3)),
      accent,
    )
    tie.position.set(0, 1.19, 0.184)
    tie.rotation.x = Math.PI
    figure.add(tie)
  }
  if (profile.clothing === 'uniform') {
    for (const side of [-1, 1]) {
      const epaulette = new THREE.Mesh(
        geometry(THREE, 'clothes:epaulette', () => new THREE.BoxGeometry(0.14, 0.035, 0.18)),
        accent,
      )
      epaulette.position.set(side * (shoulder - 0.03) * profile.shoulders, 1.4, 0)
      figure.add(epaulette)
    }
  }
  if (profile.clothing === 'uniform' || profile.clothing === 'suit') {
    const badge = new THREE.Mesh(
      geometry(THREE, 'clothes:badge', () => new THREE.CircleGeometry(0.035, 6)),
      accent,
    )
    badge.position.set(0.12, 1.29, 0.183)
    figure.add(badge)
  }
  if (profile.clothing === 'uniform') {
    const radio = new THREE.Mesh(
      geometry(THREE, 'accessory:radio', () => new THREE.BoxGeometry(0.065, 0.12, 0.035)),
      dark,
    )
    radio.position.set(-0.18, 1.31, 0.18)
    figure.add(radio)
  } else if (profile.clothing === 'combat') {
    const armband = new THREE.Mesh(
      geometry(THREE, 'accessory:armband', () => new THREE.CylinderGeometry(0.07, 0.07, 0.06, 7)),
      accent,
    )
    armband.position.set(-(shoulder + 0.008) * profile.shoulders, 1.23, 0)
    figure.add(armband)
  }
  addGarmentDetails(build)
}

import type { Group } from 'three'
import type { HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

/** Four fingers share one cached buffer with the palm; held props stay unscaled. */
export function humanHandGeometry({ THREE }: HumanLimbsBuild) {
  const parts = [
    new THREE.SphereGeometry(0.058, 10, 8).scale(0.72, 0.72, 0.48).translate(0, 0.018, 0),
  ]
  for (let index = 0; index < 4; index++) {
    const length = [0.044, 0.055, 0.051, 0.038][index]
    parts.push(
      new THREE.SphereGeometry(1, 8, 6)
        .scale(0.0095, length / 2, 0.018)
        .translate((index - 1.5) * 0.019, -0.014 - length / 2, 0),
    )
  }
  return mergeHumanDetails(parts)
}

export function addSleeveCuff(build: HumanLimbsBuild, elbow: Group): void {
  const { THREE, geometry, glow, profile } = build
  const cuff = new THREE.Mesh(
    geometry(THREE, 'details:sleeve-cuff', () => {
      const band = new THREE.CylinderGeometry(0.038, 0.04, 0.028, 10)
      return band.translate(0, -0.25, 0)
    }),
    glow(profile.shirt, 1),
  )
  cuff.name = 'sleeve-cuff'
  const girth = { slim: 0.86, average: 1, broad: 1.12 }[profile.build]
  cuff.scale.set(girth, 1, girth)
  elbow.add(cuff)
}

export function addShoeDetails(build: HumanLimbsBuild, shoe: Group): void {
  const { THREE, geometry, materials, seen } = build
  if (seen.human?.identity === 'beyond-netero' && seen.human.pose === 'reclined') return
  const seams = new THREE.Mesh(
    geometry(THREE, 'details:shoe-seams', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.117, 0.008, 0.23).translate(0, -0.036, 0.008),
        new THREE.BoxGeometry(0.1, 0.009, 0.012).translate(0, 0.008, 0.071),
      ]),
    ),
    materials.ink,
  )
  seams.name = 'shoe-sole-and-toecap'
  shoe.add(seams)
}

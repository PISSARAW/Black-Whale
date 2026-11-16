import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

export function buildAntennaApparition(
  seen: Apparition,
  { THREE, root, skin, glow }: BasicApparitionContext,
) {
  if (seen.kind !== 'antenna') return undefined
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, seen.size * 2), skin)
  pole.name = 'black-voice-pole'
  pole.position.y = seen.size
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04), glow(seen.colour, 0.9))
  bulb.name = 'black-voice-bulb'
  bulb.position.y = seen.size * 2
  root.add(pole, bulb)
  return root
}

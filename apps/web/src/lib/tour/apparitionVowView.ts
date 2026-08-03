import type { MeshBasicMaterial, Object3D, TorusGeometry } from 'three'
import type { BasicApparitionContext } from './apparitionBasicView'
import { VOW_CHAIN, type Apparition } from './apparitions'

const CHAIN_LINKS = 14

interface ChainBandContext {
  THREE: BasicApparitionContext['THREE']
  geometry: TorusGeometry
  material: MeshBasicMaterial
}

function chainBand(
  tilt: readonly [number, number],
  radius: number,
  { THREE, geometry, material }: ChainBandContext,
) {
  const ring = new THREE.Group()
  for (let index = 0; index < CHAIN_LINKS; index++) {
    const along = (index / CHAIN_LINKS) * Math.PI * 2
    const link = new THREE.Mesh(geometry, material)
    link.position.set(Math.cos(along) * radius, 0, Math.sin(along) * radius)
    link.rotation.y = Math.PI / 2 - along
    if (index % 2) link.rotateX(Math.PI / 2)
    ring.add(link)
  }
  ring.rotation.set(tilt[0], tilt[1], 0)
  return ring
}

export function buildVowApparition(
  seen: Apparition,
  { THREE, glow, root }: BasicApparitionContext,
): Object3D | null | undefined {
  if (seen.kind !== 'vow-heart') return undefined

  const meat = glow(seen.colour, seen.stage === 2 ? 0.4 : 0.95)
  const flesh = new THREE.Group()
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.58, 12, 10), meat)
    lobe.position.set(side * seen.size * 0.42, seen.size * 0.34, 0)
    flesh.add(lobe)
  }
  const point = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.95, seen.size * 1.7, 14), meat)
  point.rotation.x = Math.PI
  point.position.y = -seen.size * 0.5
  flesh.add(point)
  root.add(flesh)

  if (seen.stage === 0) return flesh

  const steel = glow(VOW_CHAIN, 1)
  const geometry = new THREE.TorusGeometry(seen.size * 0.17, seen.size * 0.055, 4, 8)
  const context = { THREE, geometry, material: steel }
  root.add(chainBand([0.28, 0], seen.size * 1.02, context))
  root.add(chainBand([1.15, 0.9], seen.size * 0.98, context))
  root.add(chainBand([-0.75, 2.1], seen.size * 0.94, context))

  const lock = new THREE.Mesh(
    new THREE.BoxGeometry(seen.size * 0.3, seen.size * 0.26, seen.size * 0.12),
    steel,
  )
  const shackle = new THREE.Mesh(
    new THREE.TorusGeometry(seen.size * 0.12, seen.size * 0.035, 4, 10, Math.PI),
    steel,
  )
  shackle.position.y = seen.size * 0.13
  lock.add(shackle)
  lock.position.set(0, seen.size * 0.1, seen.size * 1.05)
  root.add(lock)
  return flesh
}

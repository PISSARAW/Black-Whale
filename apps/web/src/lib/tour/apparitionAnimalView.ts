import type { Object3D } from 'three'
import type { BasicApparitionContext } from './apparitionBasicView'
import type { Apparition } from './apparitions'

export function buildAnimalApparition(
  seen: Apparition,
  { THREE, glow, root }: BasicApparitionContext,
): Object3D | null | undefined {
  if (seen.kind !== 'cat') return undefined

  const fur = glow(seen.colour, seen.stage === 2 ? 1 : 0.85)
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(seen.size * 0.36, seen.size * 0.5, 4, 10),
    fur,
  )
  if (seen.stage === 2) {
    body.rotation.x = Math.PI / 2
    body.position.y = seen.size * 0.72
  } else {
    body.position.y = seen.size * 0.5
  }
  root.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.3, 10, 8), fur)
  head.position.set(0, seen.size * (seen.stage === 2 ? 1.02 : 1.12), seen.size * 0.34)
  root.add(head)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(seen.size * 0.12, seen.size * 0.22, 4),
      fur,
    )
    ear.position.set(side * seen.size * 0.16, seen.size * 0.24, -seen.size * 0.04)
    head.add(ear)
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * 0.05, 6, 5),
      glow(0xfff2a8, seen.stage === 2 ? 1 : 0.8),
    )
    eye.position.set(side * seen.size * 0.12, seen.size * 0.04, seen.size * 0.26)
    head.add(eye)
  }

  const tail = new THREE.Group()
  for (let index = 0; index < 4; index++) {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (0.11 - index * 0.015), 6, 5),
      fur,
    )
    bead.position.set(0, seen.size * 0.16, -seen.size * (0.36 + index * 0.2))
    tail.add(bead)
  }
  root.add(tail)
  return tail
}

import type { Object3D } from 'three'
import { BLOOM_HEART, BLOOM_LEAF, type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

type Builder = (seen: Apparition, context: BasicApparitionContext) => Object3D | null

function bloom(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const petal = glow(seen.colour, 0.94)
  const green = glow(BLOOM_LEAF, 0.9)
  const tall = seen.size * 2.6
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(seen.size * 0.045, seen.size * 0.06, tall, 6),
    green,
  )
  stem.position.y = tall / 2
  root.add(stem)
  const leaf = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.42, 8), green)
  leaf.scale.set(1, 0.42, 1)
  leaf.rotation.x = -Math.PI / 2.6
  leaf.position.set(seen.size * 0.3, tall * 0.42, 0)
  root.add(leaf)
  const head = new THREE.Group()
  head.position.y = tall
  head.rotation.x = -Math.PI / 3
  for (let index = 0; index < 5; index++) {
    const blade = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.34, 7), petal)
    blade.scale.set(0.62, 1, 1)
    const angle = ((Math.PI * 2) / 5) * index
    blade.position.set(Math.cos(angle) * seen.size * 0.3, Math.sin(angle) * seen.size * 0.3, 0)
    blade.rotation.z = angle - Math.PI / 2
    head.add(blade)
  }
  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(seen.size * 0.15, 8, 6),
    glow(BLOOM_HEART, 1),
  )
  heart.position.z = seen.size * 0.05
  head.add(heart)
  root.add(head)
  return null
}

function note(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const ink = glow(seen.colour, 0.95)
  const flags = seen.stage % 3
  const head = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.36, 12), ink)
  head.scale.set(1, 0.72, 1)
  head.rotation.z = 0.38
  root.add(head)
  const stem = new THREE.Mesh(new THREE.PlaneGeometry(seen.size * 0.075, seen.size * 1.5), ink)
  stem.position.set(seen.size * 0.3, seen.size * 0.72, 0)
  root.add(stem)
  for (let index = 0; index < flags; index++) {
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(seen.size * 0.4, seen.size * 0.12), ink)
    tail.position.set(seen.size * 0.5, seen.size * (1.4 - index * 0.3), 0)
    tail.rotation.z = -0.5
    root.add(tail)
  }
  return root
}

function gas(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const vapour = glow(seen.colour, 0.14)
  for (let index = 0; index < 3; index++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (1 - index * 0.22), 8, 6),
      vapour,
    )
    puff.position.set(
      (index - 1) * seen.size * 0.5,
      ((index % 2) - 0.5) * seen.size * 0.4,
      ((index + 1) % 2) * seen.size * 0.4,
    )
    root.add(puff)
  }
  return root
}

function fume(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  const vapour = glow(seen.colour, 0.16)
  for (let index = 0; index < 3; index++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(seen.size * (1 - index * 0.24), 8, 6),
      vapour,
    )
    puff.position.set(
      (index - 1) * seen.size * 0.45,
      ((index + 1) % 2) * seen.size * 0.35,
      ((index % 2) - 0.5) * seen.size * 0.5,
    )
    root.add(puff)
  }
  return root
}

const BUILDERS: Partial<Record<Apparition['kind'], Builder>> = { bloom, note, gas, fume }

export function buildEmbellishmentApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | null | undefined {
  return BUILDERS[seen.kind]?.(seen, context)
}

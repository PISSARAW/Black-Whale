import type { Object3D } from 'three'
import { type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { buildGelSnakeHead } from './gelSnakeHead'

const SNAKE_BEADS = 26

function snake(seen: Apparition, { THREE, glow, root }: BasicApparitionContext): Object3D {
  const arm = glow(seen.colour, 1)
  const climb = Math.max(0.5, seen.climb ?? 1)
  const coils = Math.min(5, Math.max(2, Math.round(climb / (seen.size * 1.5))))
  const last = coils * Math.PI * 2

  // The coil, as one tube through a helix rather than a stack of rings:
  // an arm is continuous, and the join is what would give it away.
  const path: import('three').Vector3[] = []
  for (let i = 0; i <= coils * 14; i++) {
    const along = i / (coils * 14)
    const angle = along * last
    path.push(
      new THREE.Vector3(
        Math.cos(angle) * seen.size,
        -0.04 + along * climb,
        Math.sin(angle) * seen.size,
      ),
    )
  }
  const thickness = Math.min(0.11, Math.max(0.05, seen.size * 0.2))
  const body = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), coils * 16, thickness, 6, false),
    arm,
  )
  root.add(body)

  // The head, over the top of the last coil, rearing where anyone
  // walking up to the thing will meet it. It is a group of its own
  // because it is the part that moves: `driftApparitions` turns it to
  // whoever is looking and flicks the tongue.
  const head = buildGelSnakeHead({ THREE, glow, root, skin: arm })
  head.position.set(Math.cos(last) * seen.size, climb + 0.24, Math.sin(last) * seen.size)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness * 1.1, 0.34, 12), arm)
  neck.position.y = -0.24
  head.add(neck)

  // And the rest of the limb, back to the shoulder it came out of. It
  // is beads rather than a tube for the reason the chain is links: the
  // run is re-strung every frame between a hand that moves and a coil
  // that does not, and a tube would have to be rebuilt to do that.
  // Overlapped at this spacing they read as one arm.
  const run = new THREE.Group()
  run.name = 'run'
  for (let i = 0; i < SNAKE_BEADS; i++) {
    run.add(new THREE.Mesh(new THREE.SphereGeometry(thickness, 8, 6), arm))
  }
  root.add(run)

  root.add(head)
  return head
}

export function buildSnakeApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  if (seen.kind !== 'snake') return undefined
  return snake(seen, context)
}

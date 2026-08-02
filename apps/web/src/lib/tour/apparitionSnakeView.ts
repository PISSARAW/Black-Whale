import type { Object3D } from 'three'
import { SNAKE_BOW, SNAKE_HEAD, type Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

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
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(path),
      coils * 16,
      thickness,
      6,
      false,
    ),
    arm,
  )
  root.add(body)

  // The head, over the top of the last coil, rearing where anyone
  // walking up to the thing will meet it. It is a group of its own
  // because it is the part that moves: `driftApparitions` turns it to
  // whoever is looking and flicks the tongue.
  const head = new THREE.Group()
  head.position.set(Math.cos(last) * seen.size, climb + 0.24, Math.sin(last) * seen.size)

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(thickness, thickness * 1.1, 0.34, 6),
    arm,
  )
  neck.position.y = -0.24
  head.add(neck)

  // The bow, at the join, which is the one thing that makes this Snake
  // Arm rather than a snake: two pink wings and a knot between them,
  // sat exactly where the black stops and the violet starts.
  const ribbon = glow(SNAKE_BOW, 1)
  const bow = new THREE.Group()
  bow.position.y = -0.07
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.17, 5), ribbon)
    wing.rotation.z = (side * Math.PI) / 2
    wing.position.set(side * 0.13, 0.02, 0)
    bow.add(wing)
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), ribbon)
  bow.add(knot)
  head.add(bow)

  const violet = glow(SNAKE_HEAD, 1)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), violet)
  // Long rather than round, and pointing the way the head faces, which
  // is -z: a snout is what says which end of a snake this is.
  skull.scale.set(0.95, 0.82, 1.45)
  head.add(skull)

  // The mouth, held open. A snake that has hold of something is not a
  // snake with its mouth shut.
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), violet)
  jaw.scale.set(0.85, 0.42, 1.2)
  jaw.position.set(0, -0.11, -0.06)
  jaw.rotation.x = -0.3
  head.add(jaw)

  const white = glow(0xf7f2ff, 1)
  const ink = glow(0x1a1420, 1)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), white)
    eye.position.set(side * 0.11, 0.06, -0.16)
    head.add(eye)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), ink)
    pupil.position.set(side * 0.115, 0.06, -0.225)
    head.add(pupil)
    // Two fangs, because the mouth is open and an open mouth with
    // nothing in it reads as a puppet rather than a snake.
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 4), white)
    fang.rotation.x = Math.PI
    fang.position.set(side * 0.065, -0.09, -0.19)
    head.add(fang)
  }

  // The tongue, forked, out of the front of the mouth. Named because
  // the drift reaches for it by name to flick it.
  const tongue = new THREE.Group()
  tongue.name = 'tongue'
  tongue.position.set(0, -0.08, -0.2)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 5), ribbon)
  stem.rotation.x = Math.PI / 2
  stem.position.z = -0.11
  tongue.add(stem)
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.002, 0.12, 5), ribbon)
    tip.rotation.x = Math.PI / 2
    tip.rotation.z = side * 0.4
    tip.position.set(side * 0.028, 0, -0.27)
    tongue.add(tip)
  }
  head.add(tongue)

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

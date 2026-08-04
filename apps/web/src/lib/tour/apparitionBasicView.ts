import type { Group, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { CardFace } from './morena'
import { buildHumanFigure, type HumanFigure } from './humanFigure'
import type { Glass } from './humanAura'

type Three = typeof import('three')
type Glow = (colour: number, opacity: number) => MeshBasicMaterial

export interface BasicApparitionContext {
  THREE: Three
  glow: Glow
  /** The refractive shell an aura wears. Absent on the `low` palier. */
  glass?: Glass
  root: Group
  skin: MeshBasicMaterial
  observerGyo?: boolean
  cardFace?: (face: CardFace, ink: string) => MeshBasicMaterial
}

export interface BasicApparitionParts {
  turns: Object3D | null
  humanLod?: HumanFigure['lod']
  humanAnimate?: HumanFigure['animate']
}

type Builder = (seen: Apparition, context: BasicApparitionContext) => BasicApparitionParts

function owl(seen: Apparition, { THREE, glow, root, skin }: BasicApparitionContext) {
  const cloak = new THREE.Mesh(
    new THREE.CapsuleGeometry(seen.size * 0.64, seen.size * 0.82, 5, 10),
    skin,
  )
  cloak.scale.set(1, 1.08, 0.72)
  cloak.position.y = seen.size * 0.15
  root.add(cloak)
  for (const side of [-1, 1]) {
    const peak = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.2, seen.size * 0.78, 5), skin)
    peak.position.set(side * seen.size * 0.34, seen.size * 1.05, 0)
    peak.rotation.z = side * -0.18
    root.add(peak)
  }
  for (let index = 0; index < 7; index++) {
    const drip = new THREE.Mesh(
      new THREE.ConeGeometry(
        seen.size * (0.1 + (index % 2) * 0.025),
        seen.size * (0.32 + (index % 3) * 0.11),
        5,
      ),
      skin,
    )
    drip.rotation.z = Math.PI
    drip.position.set((index - 3) * seen.size * 0.18, -seen.size * (0.68 + (index % 3) * 0.06), 0)
    root.add(drip)
  }
  const head = new THREE.Group()
  head.position.set(0, seen.size * 0.28, -seen.size * 0.52)
  head.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.7, seen.size * 0.16, seen.size * 0.035),
      glow(0x171318, 1),
    ),
  )
  for (let slit = 0; slit < 5; slit++) {
    const gleam = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.025, seen.size * 0.1, seen.size * 0.012),
      glow(0xc5b8b0, 0.7),
    )
    gleam.position.set((slit - 2) * seen.size * 0.09, 0, -seen.size * 0.025)
    head.add(gleam)
  }
  const tear = new THREE.Mesh(
    new THREE.ConeGeometry(seen.size * 0.09, seen.size * 0.25, 5),
    glow(0x6b5d68, 0.92),
  )
  tear.rotation.z = Math.PI
  tear.position.set(0, -seen.size * 0.28, 0)
  head.add(tear)
  root.add(head)
  return { turns: head }
}

function human(
  seen: Apparition,
  { THREE, glow, glass, root, observerGyo }: BasicApparitionContext,
) {
  const figure = buildHumanFigure({
    THREE,
    glow,
    ...(glass ? { glass } : {}),
    seen: seen as Apparition & { kind: 'avatar' | 'combatant' },
    observerGyo,
  })
  root.add(figure.root)
  return { turns: figure.turns, humanLod: figure.lod, humanAnimate: figure.animate }
}

function card(seen: Apparition, { THREE, glow, root }: BasicApparitionContext) {
  for (let index = 0; index < Math.max(1, seen.stage); index++) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(seen.size, seen.size * 1.5),
      glow([0x4d8ff0, 0xf0c94d, 0xe5484d][Math.min(2, index)], 0.9),
    )
    face.position.set(index * seen.size * 0.28, index * seen.size * 0.12, index * 0.01)
    face.rotation.z = (index - 1) * 0.16
    root.add(face)
  }
  return { turns: root }
}

function mark(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  root.add(new THREE.Mesh(new THREE.TorusGeometry(seen.size, seen.size * 0.12, 6, 20), skin))
  for (let index = 0; index < 3; index++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 1.8, seen.size * 0.09, seen.size * 0.09),
      skin,
    )
    bar.rotation.z = (Math.PI / 3) * index
    root.add(bar)
  }
  return { turns: root }
}

function stamp(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  const stroke = (lean: number, offset: number) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.16, seen.size * 1.1, seen.size * 0.16),
      skin,
    )
    bar.rotation.z = lean
    bar.position.set(offset, 0, 0)
    return bar
  }
  root.add(stroke(0.42, -seen.size * 0.2), stroke(-0.42, seen.size * 0.2))
  if (seen.stage) {
    root.add(
      new THREE.Mesh(new THREE.TorusGeometry(seen.size * 0.95, seen.size * 0.09, 6, 18), skin),
    )
  }
  return { turns: root }
}

function sun(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  root.add(new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.55, 16), skin))
  for (let index = 0; index < 8; index++) {
    const ray = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 0.09, seen.size * 0.42, seen.size * 0.09),
      skin,
    )
    const angle = (Math.PI / 4) * index
    ray.position.set(Math.cos(angle) * seen.size * 0.86, Math.sin(angle) * seen.size * 0.86, 0)
    ray.rotation.z = angle - Math.PI / 2
    root.add(ray)
  }
  return { turns: root }
}

function moon(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  const crescent = new THREE.Shape()
  crescent.absarc(0, 0, seen.size, Math.PI * 0.42, -Math.PI * 0.42, true)
  crescent.absarc(seen.size * 0.42, 0, seen.size * 0.92, -Math.PI * 0.36, Math.PI * 0.36, false)
  root.add(new THREE.Mesh(new THREE.ShapeGeometry(crescent), skin))
  return { turns: root }
}

function starGeometry(THREE: Three, size: number) {
  const shape = new THREE.Shape()
  for (let index = 0; index < 10; index++) {
    const angle = (Math.PI / 5) * index - Math.PI / 2
    const radius = index % 2 === 0 ? size : size * 0.42
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

function star(seen: Apparition, { THREE, root, skin }: BasicApparitionContext) {
  const mesh = new THREE.Mesh(starGeometry(THREE, seen.size), skin)
  root.add(mesh)
  return { turns: mesh }
}

/**
 * The name the scene finds a bird's wings and its thread by.
 *
 * A bird beats and a thread is re-aimed at the visitor every frame, and both
 * are jobs for the render loop rather than for the builder — but the builder is
 * the only thing that knows which child is which. A name is the cheapest handle
 * three.js offers, and it keeps `BasicApparitionParts` from growing a field
 * that only one apparition in the walk would ever fill.
 */
export const BIRD_WINGS = 'bird-wings'
export const BIRD_TETHER = 'bird-tether'

/**
 * One of Cluck's, and the thread it is being flown on.
 *
 * The bird is a bird: a body, a head, a tail and two wings that beat. What
 * makes it this ability rather than a pigeon is the second half — a filament
 * running back to the hand that called it, one per bird, drawn only to an eye
 * with aura on it. That is ch. 320's own claim about the flock and the only
 * part of it a reconstruction can actually show: the birds are ordinary, the
 * bundle of threads is not.
 */
function bird(seen: Apparition, { THREE, glow, root, skin, observerGyo }: BasicApparitionContext) {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(seen.size * 0.34, seen.size * 0.75, 4, 8),
    skin,
  )
  body.rotation.x = Math.PI / 2
  root.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.3, 8, 6), skin)
  head.position.z = -seen.size * 0.72
  head.position.y = seen.size * 0.12
  root.add(head)

  const tail = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.26, seen.size * 0.6, 4), skin)
  tail.rotation.x = -Math.PI / 2
  tail.position.z = seen.size * 0.82
  root.add(tail)

  // Held in a group of their own so the loop can beat both with one rotation
  // each and never touch the body it is beating them against.
  const wings = new THREE.Group()
  wings.name = BIRD_WINGS
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(seen.size * 1.15, seen.size * 0.05, seen.size * 0.5),
      skin,
    )
    wing.position.set(side * seen.size * 0.62, 0, 0)
    wings.add(wing)
  }
  root.add(wings)

  // Two vertices and the far one is rewritten every frame: the near end is the
  // bird and the far end is the wrist, which walks off while the bird circles.
  const thread = new THREE.BufferGeometry()
  thread.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
  const tether = new THREE.Line(thread, new THREE.LineBasicMaterial({ color: seen.colour }))
  tether.name = BIRD_TETHER
  tether.frustumCulled = false
  tether.visible = Boolean(observerGyo)
  root.add(tether)

  // No `turns`: the whole bird is aimed along its own orbit by the loop, which
  // is the only thing that knows where the ring's centre got to this frame.
  return { turns: null }
}

const BUILDERS: Partial<Record<Apparition['kind'], Builder>> = {
  bird,
  owl,
  avatar: human,
  combatant: human,
  card,
  mark,
  stamp,
  'sun-mark': sun,
  'moon-mark': moon,
  star,
}

export function buildBasicApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): BasicApparitionParts | null {
  return BUILDERS[seen.kind]?.(seen, context) ?? null
}

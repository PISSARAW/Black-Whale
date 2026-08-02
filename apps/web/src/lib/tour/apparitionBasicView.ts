import type { Group, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { CardFace } from './morena'
import { buildHumanFigure, type HumanFigure } from './humanFigure'

type Three = typeof import('three')
type Glow = (colour: number, opacity: number) => MeshBasicMaterial

export interface BasicApparitionContext {
  THREE: Three
  glow: Glow
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
    drip.position.set(
      (index - 3) * seen.size * 0.18,
      -seen.size * (0.68 + (index % 3) * 0.06),
      0,
    )
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

function human(seen: Apparition, { THREE, glow, root, observerGyo }: BasicApparitionContext) {
  const figure = buildHumanFigure({
    THREE,
    glow,
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

const BUILDERS: Partial<Record<Apparition['kind'], Builder>> = {
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

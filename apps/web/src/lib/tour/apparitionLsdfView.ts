import type { BufferGeometry, Group, Object3D } from 'three'
import type { BasicApparitionContext } from './apparitionBasicView'
import type { Apparition } from './apparitions'

const INK = 0x17191b
const UNIFORM = 0xe8e5da
const FACE = 0xd3d0c5
const METAL = 0x8f9492
type Point = readonly [number, number, number]

type Part = {
  name: string
  geometry: BufferGeometry
  colour: number
  position: Point
}

function levelSegments(level: number): number[] {
  const segments: Record<number, number[]> = {
    1: [2, 5],
    2: [0, 2, 3, 4, 6],
    3: [0, 2, 3, 5, 6],
    4: [1, 2, 3, 5],
    5: [0, 1, 3, 5, 6],
    6: [0, 1, 3, 4, 5, 6],
    7: [0, 2, 5],
    8: [0, 1, 2, 3, 4, 5, 6],
    9: [0, 1, 2, 3, 5, 6],
  }
  return segments[Math.max(1, Math.min(9, Math.floor(level)))] ?? segments[4]
}

function guard(
  context: BasicApparitionContext,
  options: { level: number; scale: number; at: Point },
) {
  const { THREE, glow } = context
  const { level, scale, at } = options
  const unit = new THREE.Group()
  unit.name = `lsdf-guard-level-${level}`
  unit.position.set(...at)
  unit.scale.setScalar(scale)

  const add = ({ name, geometry, colour, position }: Part) => {
    const mesh = new THREE.Mesh(geometry, glow(colour, 1))
    mesh.name = name
    mesh.position.set(...position)
    unit.add(mesh)
    return mesh
  }
  const box = (...[name, dimensions, colour, position]: [string, Point, number, Point]) =>
    add({ name, geometry: new THREE.BoxGeometry(...dimensions), colour, position })
  const sphere = (...[name, radius, colour, position]: [string, number, number, Point]) =>
    add({ name, geometry: new THREE.SphereGeometry(radius, 14, 10), colour, position })
  const cylinder = (
    ...[name, radii, colour, position]: [string, readonly [number, number, number], number, Point]
  ) =>
    add({
      name,
      geometry: new THREE.CylinderGeometry(radii[0], radii[1], radii[2], 12),
      colour,
      position,
    })

  // Squared face, cap and circular ear pieces preserve the toy-like manga anatomy.
  box('lsdf-head', [0.68, 0.58, 0.52], UNIFORM, [0, 1.5, 0])
  box('lsdf-face', [0.52, 0.31, 0.035], FACE, [0, 1.44, 0.278])
  for (const side of [-1, 1]) {
    cylinder(`lsdf-ear-${side}`, [0.13, 0.13, 0.1], METAL, [side * 0.4, 1.5, 0]).rotation.z =
      Math.PI / 2
    box(`lsdf-eye-${side}`, [0.11, 0.09, 0.025], INK, [side * 0.15, 1.49, 0.31])
  }
  box('lsdf-mouth', [0.2, 0.035, 0.025], INK, [0, 1.34, 0.31])

  const badge = box('lsdf-level-badge', [0.42, 0.25, 0.04], UNIFORM, [0, 1.78, 0.2])
  badge.rotation.x = -0.12
  const segmentPositions: readonly (readonly [number, number, number, number])[] = [
    [0, 1.87, 0.235, 0],
    [-0.105, 1.81, 0.235, Math.PI / 2],
    [0.105, 1.81, 0.235, Math.PI / 2],
    [0, 1.74, 0.235, 0],
    [-0.105, 1.67, 0.235, Math.PI / 2],
    [0.105, 1.67, 0.235, Math.PI / 2],
    [0, 1.61, 0.235, 0],
  ]
  for (const segment of levelSegments(level)) {
    const [x, y, z, rotation] = segmentPositions[segment]
    const bar = box(`lsdf-level-${level}-segment-${segment}`, [0.14, 0.025, 0.018], INK, [x, y, z])
    bar.rotation.z = rotation
  }

  box('lsdf-torso', [0.82, 1.02, 0.48], UNIFORM, [0, 0.68, 0])
  box('lsdf-centre-stripe', [0.12, 0.96, 0.035], INK, [0, 0.68, 0.26])
  for (let clasp = 0; clasp < 4; clasp++) {
    const y = 1.02 - clasp * 0.23
    box(`lsdf-clasp-${clasp}`, [0.48, 0.055, 0.04], METAL, [0, y, 0.29])
    for (const side of [-1, 1])
      sphere(`lsdf-clasp-${clasp}-stud-${side}`, 0.055, METAL, [side * 0.24, y, 0.3])
  }

  for (const side of [-1, 1]) {
    sphere(`lsdf-shoulder-${side}`, 0.28, INK, [side * 0.55, 0.98, 0]).scale.set(1.25, 0.78, 1.05)
    cylinder(`lsdf-upper-arm-${side}`, [0.15, 0.14, 0.56], UNIFORM, [side * 0.59, 0.58, 0])
    sphere(`lsdf-glove-${side}`, 0.25, INK, [side * 0.62, 0.2, 0.06]).scale.set(1.05, 1.15, 0.95)
    box(`lsdf-thigh-${side}`, [0.27, 0.58, 0.3], UNIFORM, [side * 0.23, -0.13, 0])
    cylinder(`lsdf-knee-${side}`, [0.13, 0.13, 0.3], METAL, [side * 0.23, -0.48, 0]).rotation.z =
      Math.PI / 2
    box(`lsdf-shin-${side}`, [0.25, 0.56, 0.27], UNIFORM, [side * 0.23, -0.82, 0])
    box(`lsdf-boot-${side}`, [0.34, 0.25, 0.55], INK, [side * 0.23, -1.2, 0.11])
  }
  return unit
}

function addFormation(formation: Group, context: BasicApparitionContext, stage: number) {
  formation.add(
    guard(context, { level: Math.max(5, stage), scale: 0.9, at: [0, -0.05, 0.2] }),
    guard(context, { level: 4, scale: 0.68, at: [-1.15, 0.08, -0.48] }),
    guard(context, { level: 4, scale: 0.68, at: [1.15, 0.08, -0.48] }),
  )
}

/** Yokotani's manga design shown as a small formation, because LSDF manifests as a force. */
export function buildLsdfApparition(
  seen: Apparition,
  context: BasicApparitionContext,
): Object3D | undefined {
  if (seen.kind !== 'lsdf-guard') return undefined
  const formation = new context.THREE.Group()
  formation.name = 'lsdf-numbered-guard-formation'
  addFormation(formation, context, seen.stage)
  context.root.add(formation)
  return formation
}

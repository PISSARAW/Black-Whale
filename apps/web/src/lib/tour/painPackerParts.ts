import type { BufferGeometry, Object3D } from 'three'
import type { BasicApparitionContext } from './apparitionBasicView'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel, type Point3 } from './kurapikaGeometry'

export const PAIN = {
  red: 0x641f36,
  white: 0xe6e3dc,
  black: 0x17151c,
  steel: 0x99abb1,
  gold: 0xc6ad65,
}
export type PainKit = Pick<BasicApparitionContext, 'THREE' | 'glow'>
const SHAPES = new WeakMap<PainKit['THREE'], Map<string, BufferGeometry>>()

export function painPart(
  kit: PainKit,
  parent: Object3D,
  options: { name: string; colour: number; make: () => BufferGeometry },
) {
  let cache = SHAPES.get(kit.THREE)
  if (!cache) {
    cache = new Map()
    SHAPES.set(kit.THREE, cache)
  }
  let shape = cache.get(options.name)
  if (!shape) {
    shape = options.make()
    shape.userData.sharedHuman = true
    cache.set(options.name, shape)
  }
  const mesh = new kit.THREE.Mesh(shape, kit.glow(options.colour, 1))
  mesh.name = options.name
  parent.add(mesh)
  return mesh
}

export function painMerge(parts: BufferGeometry[]) {
  const normalized = parts.map((part) => {
    part.deleteAttribute('uv')
    if (!part.index) return part
    const flat = part.toNonIndexed()
    part.dispose()
    return flat
  })
  return mergeHumanDetails(normalized)
}

export function painPanel(
  kit: PainKit,
  points: readonly (readonly [number, number])[],
  depth: (x: number, y: number) => number,
) {
  return kurapikaSurfacePanel(kit.THREE, {
    points: points.map(([x, y]) => [x, y, 0] as Point3),
    depth,
  })
}

export function painCurve(kit: PainKit, points: readonly Point3[], radius = 0.004) {
  return new kit.THREE.TubeGeometry(
    new kit.THREE.CatmullRomCurve3(points.map((p) => new kit.THREE.Vector3(...p))),
    32,
    radius,
    7,
    false,
  )
}

/** Project painted marks onto the same elliptical sections as the garment itself. */
export function painFront(
  sections: readonly (readonly [number, number])[],
  point: readonly [number, number],
  flatten = 0.77,
) {
  const [x, sourceY] = point
  const y = Math.max(sections[0][1], Math.min(sections[sections.length - 1][1], sourceY))
  const next = Math.max(
    1,
    sections.findIndex(([, height]) => height >= y),
  )
  const [ra, ya] = sections[next - 1],
    [rb, yb] = sections[next]
  const radius = ra + ((rb - ra) * (y - ya)) / Math.max(0.001, yb - ya)
  return Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) * flatten + 0.006
}

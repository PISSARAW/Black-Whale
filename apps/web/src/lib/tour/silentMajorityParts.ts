import type { BufferGeometry, Group, Material, Mesh, Object3D } from 'three'

/**
 * The small vocabulary Silent Majority's puppet is drawn with.
 *
 * ADR-005 §3 keeps textures out, so every mark on the costume is a flat mesh,
 * a tube along a curve, or a tone baked on the vertices. These helpers are that
 * and nothing else: where a mark goes, how a volute is wound, how a screentone
 * gradient is written onto a shared buffer.
 */
export type Three = typeof import('three')
export type Geometry = (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry
export type Outlined = (shape: {
  THREE: Three
  geometry: BufferGeometry
  material: Material
  ink: Material
  scale?: number
}) => Group

export interface Kit {
  THREE: Three
  geometry: Geometry
}

export interface Mark {
  key: string
  make: () => BufferGeometry
  material: Material
  at: [number, number, number]
  /** Rotation about the axis the mark faces. */
  turn?: number
  scale?: [number, number]
}

/** One flat mark, cached by key and hung on its parent. */
export function place(kit: Kit, parent: Object3D, mark: Mark): Mesh {
  const mesh = new kit.THREE.Mesh(kit.geometry(kit.THREE, mark.key, mark.make), mark.material)
  mesh.position.set(...mark.at)
  mesh.rotation.z = mark.turn ?? 0
  if (mark.scale) mesh.scale.set(mark.scale[0], mark.scale[1], 1)
  parent.add(mesh)
  return mesh
}

export interface Volute {
  radius: number
  turns: number
  thickness: number
}

/** A wound line, widest at the rim: the sleeve crests and nothing else. */
export function voluteGeometry(THREE: Three, volute: Volute): BufferGeometry {
  const points = []
  const steps = Math.ceil(volute.turns * 14)
  for (let i = 0; i <= steps; i += 1) {
    const along = 0.1 + (i / steps) * 0.9
    const angle = along * volute.turns * Math.PI * 2
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * volute.radius * along,
        Math.sin(angle) * volute.radius * along,
        0,
      ),
    )
  }
  const made = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    steps * 2,
    volute.thickness,
    5,
  )
  made.scale(1, 1, 0.35)
  return made
}

export interface Wave {
  length: number
  sway: number
  periods: number
  thickness: number
  /** Half a period of offset: the second serpent of a pair. */
  mirrored?: boolean
}

/** A line that sways as it runs down: one serpent, or one fold of the sash. */
export function waveGeometry(THREE: Three, wave: Wave): BufferGeometry {
  const points = []
  const steps = Math.ceil(wave.periods * 12)
  const phase = wave.mirrored ? Math.PI : 0
  for (let i = 0; i <= steps; i += 1) {
    const along = i / steps
    const sway = Math.sin(along * wave.periods * Math.PI * 2 + phase) * wave.sway
    points.push(new THREE.Vector3(sway, -along * wave.length, 0))
  }
  const made = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    steps * 2,
    wave.thickness,
    5,
  )
  made.scale(1, 1, 0.35)
  return made
}

/**
 * The screentone, as a tone per vertex: `top` at the highest point of the mass
 * and `bottom` at the lowest. `outlined` leaves a buffer that already carries a
 * colour alone, which is what lets a gradient replace its two-value shade.
 */
export function graded(
  THREE: Three,
  source: BufferGeometry,
  tones: [top: number, bottom: number],
): BufferGeometry {
  const position = source.getAttribute('position')
  source.computeBoundingBox()
  const box = source.boundingBox
  if (!box) return source
  const span = Math.max(box.max.y - box.min.y, 1e-6)
  const colours = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i += 1) {
    const height = (position.getY(i) - box.min.y) / span
    colours.fill(tones[1] + (tones[0] - tones[1]) * height, i * 3, i * 3 + 3)
  }
  source.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  return source
}

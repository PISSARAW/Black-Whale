import type * as Three from 'three'
import type { Point3 } from './banquetDetailBuilder'
import { CentralCourthouseSurface, COURTHOUSE } from './centralCourthouseDetailSurface'

/** Botobai's exposed wooden seat: no bench or high back is visible in the panel. */
export function dressCourthouseSeat(surface: CentralCourthouseSurface): void {
  const [width, depth] = surface.structure.size
  const height = surface.structure.height
  surface.box([width, 0.14, depth], [0, height - 0.07, 0], COURTHOUSE.woodLight)
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - 0.11)
    for (const end of [-1, 1]) {
      surface.box(
        [0.15, height - 0.14, 0.15],
        [x, (height - 0.14) / 2, end * (depth / 2 - 0.11)],
        COURTHOUSE.wood,
      )
    }
    surface.box([0.1, 0.11, depth - 0.16], [x, 0.3, 0], COURTHOUSE.woodDark)
    surface.box(
      [width - 0.15, 0.2, 0.09],
      [0, height - 0.24, side * (depth / 2 - 0.09)],
      COURTHOUSE.wood,
    )
  }
}

/** Long-handled rectangular mallet resting on the floor, as in the supplied panel. */
export function dressCourthouseGavel(surface: CentralCourthouseSurface): void {
  const [width, depth] = surface.structure.size
  const height = surface.structure.height
  const headHeight = 0.34
  surface.box([width, headHeight, depth], [0, headHeight / 2, 0], COURTHOUSE.woodDark)
  for (const side of [-1, 1]) {
    surface.box(
      [0.08, headHeight, depth],
      [side * (width / 2 - 0.09), headHeight / 2, 0],
      COURTHOUSE.binding,
    )
  }
  surface.cylinder(
    { radius: 0.055, height: height - headHeight },
    [0, (height + headHeight) / 2, 0],
    COURTHOUSE.wood,
  )
  for (const y of [0.5, 1.0, 1.55, 2.1, height - 0.06]) {
    surface.cylinder({ radius: 0.074, height: 0.055 }, [0, y, 0], COURTHOUSE.woodLight)
  }
}

/** Two panel-fronted desks at different heights, both to the right of the seat. */
export function dressCourthouseDesk(surface: CentralCourthouseSurface): void {
  const [width, depth] = surface.structure.size
  const height = surface.structure.height
  const faceZ = depth / 2 - 0.065
  surface.box([width, 0.11, depth], [0, height - 0.055, 0], COURTHOUSE.woodLight)
  surface.box(
    [width - 0.1, height - 0.15, 0.085],
    [0, (height - 0.15) / 2 + 0.025, faceZ],
    COURTHOUSE.wood,
  )
  for (const side of [-1, 1]) {
    surface.box(
      [0.11, height - 0.11, depth - 0.08],
      [side * (width / 2 - 0.09), (height - 0.11) / 2, 0],
      COURTHOUSE.wood,
    )
    surface.box(
      [width - 0.08, 0.08, 0.06],
      [0, side < 0 ? 0.1 : height - 0.19, faceZ + 0.035],
      COURTHOUSE.woodLight,
    )
  }
  const panels = width > 3 ? 3 : 2
  const pitch = (width - 0.28) / panels
  for (let panel = 0; panel <= panels; panel++) {
    surface.box(
      [0.065, height - 0.25, 0.06],
      [-width / 2 + 0.14 + panel * pitch, height / 2 - 0.04, faceZ + 0.035],
      COURTHOUSE.woodLight,
    )
  }
}

function curtainPoint(surface: CentralCourthouseSurface, u: number, v: number): Point3 {
  const [width, depth] = surface.structure.size
  const height = surface.structure.height
  const gather = Math.exp(-(((v - 0.63) / 0.22) ** 2))
  const inner = width * (0.08 + 0.28 * gather)
  const edge = width / 2 - 0.03
  const x = inner + u * (edge - inner)
  const fold = Math.sin(u * Math.PI * 18 + v * 0.65)
  return [x, height * (1 - v), fold * depth * 0.42]
}

/** Gathered cloth is actual folded geometry, confined to its blueprint envelope. */
export function dressCourthouseCurtain(
  surface: CentralCourthouseSurface,
  THREE: typeof Three,
): void {
  const [width, depth] = surface.structure.size
  const height = surface.structure.height
  surface.box([width, 0.07, depth], [0, height - 0.035, 0], COURTHOUSE.trim)
  for (const side of [-1, 1]) {
    const vertices: number[] = []
    const point = (u: number, v: number): Point3 => {
      const [x, y, z] = curtainPoint(surface, u, v)
      return surface.point([x * side, y, z])
    }
    for (let row = 0; row < 20; row++) {
      for (let column = 0; column < 36; column++) {
        const a = point(column / 36, row / 20)
        const b = point((column + 1) / 36, row / 20)
        const c = point((column + 1) / 36, (row + 1) / 20)
        const d = point(column / 36, (row + 1) / 20)
        // Both sides remain visible when the visitor walks behind the cloth.
        vertices.push(...a, ...b, ...c, ...a, ...c, ...d, ...c, ...b, ...a, ...d, ...c, ...a)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    surface.into.add(geometry, { at: [0, 0, 0], colour: COURTHOUSE.fabric })
  }
}

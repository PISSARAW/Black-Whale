import type * as Three from 'three'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'

export const CARVED = 0xb49a69
export const CARVED_SHADE = 0x79684c
export const STONE = 0xc3bba7

/** Curled acanthus vocabulary visible on the chair and the platform panels. */
export function scroll(
  into: BanquetDetailBuilder,
  options: { at: Point3; size: number; mirror: number },
): void {
  const points: Point3[] = []
  for (let index = 0; index <= 14; index++) {
    const angle = (index * Math.PI * 1.65) / 14
    const radius = options.size * (1 - index / 18)
    points.push([Math.cos(angle) * radius * options.mirror, Math.sin(angle) * radius, 0])
  }
  into.curve(points, options.size * 0.105, { at: options.at, colour: CARVED })
}

export function rosette(into: BanquetDetailBuilder, at: Point3, radius: number): void {
  for (let petal = 0; petal < 8; petal++) {
    const angle = (petal * Math.PI) / 4
    into.sphere([radius * 0.27, radius * 0.56, radius * 0.14], {
      at: [at[0] + Math.sin(angle) * radius * 0.5, at[1] + Math.cos(angle) * radius * 0.5, at[2]],
      rotation: [0, 0, -angle],
      colour: CARVED,
    })
  }
  into.sphere([radius * 0.24, radius * 0.24, radius * 0.2], {
    at: [at[0], at[1], at[2] + 0.025],
    colour: CARVED_SHADE,
  })
}

/** A cloth surface, rather than the old row of cylindrical curtain poles. */
export function pleatedCloth(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  at: Point3
  width: number
  height: number
  colour: number
  facing: number
  swag?: boolean
}): void {
  const { THREE, into, at, width, height, facing } = options
  const segments = Math.ceil(width * 12)
  const vertices: number[] = []
  const point = (index: number, top: boolean): Point3 => {
    const fraction = index / segments
    const hem = options.swag ? Math.sin(fraction * Math.PI) ** 2 * height * 0.4 : 0
    return [
      at[0] - width / 2 + fraction * width,
      at[1] + (top ? height : hem),
      at[2] + Math.cos(fraction * width * Math.PI * 6) * 0.07,
    ]
  }
  for (let index = 0; index < segments; index++) {
    const a = point(index, false),
      b = point(index + 1, false)
    const c = point(index + 1, true),
      d = point(index, true)
    if (facing > 0) vertices.push(...a, ...b, ...c, ...a, ...c, ...d)
    else vertices.push(...a, ...c, ...b, ...a, ...d, ...c)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  into.add(geometry, { at: [0, 0, 0], colour: options.colour })
}

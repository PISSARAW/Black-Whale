import type * as Three from 'three'
import type { Structure } from './types'
import { BanquetDetailBuilder, type Point3 } from './banquetDetailBuilder'

const LINEN = 0xe2ded0
const BRASS = 0xb39961
// The cloth is repeated on 72 tables, so its folds share a bounded mesh budget.
const CLOTH_SEGMENTS = 32

/** The cloth wraps the audited table solid, including its collision outline. */
export function dressBanquetTable(options: {
  THREE: typeof Three
  into: BanquetDetailBuilder
  table: Structure
  floor: number
}): void {
  const { THREE, into, table, floor } = options
  const [x, z] = table.at
  const y = floor + table.base + table.height
  const radius = table.size[0] / 2
  into.cylinder(
    { radius: radius + 0.018, height: 0.025, sides: 32 },
    { at: [x, y + 0.012, z], colour: LINEN },
  )
  const vertices: number[] = []
  const rings = [
    { y: y + 0.012, radius: radius + 0.018 },
    { y: y - 0.16, radius: radius + 0.025 },
    { y: floor + 0.06, radius: radius + 0.045 },
  ]
  const point = (index: number, ring: (typeof rings)[number]): Point3 => {
    const angle = (index * Math.PI * 2) / CLOTH_SEGMENTS
    const pleat = ((index % 2) * 0.035 * (y - ring.y)) / table.height
    return [
      x + Math.cos(angle) * (ring.radius + pleat),
      ring.y,
      z + Math.sin(angle) * (ring.radius + pleat),
    ]
  }
  for (let band = 0; band < rings.length - 1; band++) {
    for (let index = 0; index < CLOTH_SEGMENTS; index++) {
      const a = point(index, rings[band]),
        b = point(index + 1, rings[band])
      const c = point(index + 1, rings[band + 1]),
        d = point(index, rings[band + 1])
      vertices.push(...a, ...b, ...c, ...a, ...c, ...d)
    }
  }
  const cloth = new THREE.BufferGeometry()
  cloth.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  cloth.computeVertexNormals()
  into.add(cloth, { at: [0, 0, 0], colour: LINEN })
  for (let seat = 0; seat < 6; seat++) {
    const angle = (seat * Math.PI) / 3
    const px = x + Math.cos(angle) * radius * 0.66
    const pz = z + Math.sin(angle) * radius * 0.66
    into.cylinder(
      { radius: 0.145, height: 0.016, sides: 8 },
      { at: [px, y + 0.038, pz], colour: 0xf5f1e4 },
    )
    into.add(new THREE.RingGeometry(0.115, 0.125, 12), {
      at: [px, y + 0.049, pz],
      rotation: [-Math.PI / 2, 0, 0],
      colour: BRASS,
    })
    const gx = x + Math.cos(angle + 0.25) * radius * 0.43
    const gz = z + Math.sin(angle + 0.25) * radius * 0.43
    into.cylinder(
      { radius: 0.034, height: 0.008, sides: 6 },
      { at: [gx, y + 0.035, gz], colour: 0xc4c7bd },
    )
    into.cylinder(
      { radius: 0.008, height: 0.09, sides: 4 },
      { at: [gx, y + 0.08, gz], colour: 0xb6c1ba },
    )
    into.cylinder(
      { radius: 0.035, bottom: 0.015, height: 0.07, sides: 6 },
      { at: [gx, y + 0.155, gz], colour: 0xcbd4cb },
    )
    into.box([0.13, 0.012, 0.075], {
      at: [px, y + 0.055, pz],
      rotation: [0, -angle, 0],
      colour: 0xf8f4e9,
    })
  }
}

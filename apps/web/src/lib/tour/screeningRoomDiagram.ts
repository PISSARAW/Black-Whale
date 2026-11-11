import type * as Three from 'three'
import { CasinoFixture } from './casinoFixture'

/** Original simplified outline and dotted route visible on the supplied screen. */
export function dressScreeningDiagram(THREE: typeof Three, model: CasinoFixture): void {
  model.box([0.02, 0.91, 0.91], [0.42, 0.5, 0], 0x74766f)
  const contour = [
    [-0.2, 0.79],
    [-0.17, 0.73],
    [-0.17, 0.66],
    [-0.12, 0.59],
    [-0.11, 0.52],
    [-0.06, 0.47],
    [-0.09, 0.41],
    [-0.13, 0.4],
    [-0.16, 0.43],
    [-0.2, 0.39],
    [-0.25, 0.42],
    [-0.27, 0.45],
    [-0.25, 0.5],
    [-0.29, 0.55],
    [-0.25, 0.63],
    [-0.24, 0.7],
  ]
  const shape = new THREE.Shape()
  contour.forEach(([z, y], i) => (i ? shape.lineTo(-z, y) : shape.moveTo(-z, y)))
  shape.closePath()
  model.add(new THREE.ShapeGeometry(shape), {
    at: [0.44, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    colour: 0xeae7dc,
  })
  for (let i = 0; i < 22; i++) {
    const t = i / 21
    model.ball(
      [0.445, 0.78 - 0.18 * t - 0.08 * Math.sin(t * Math.PI), 0.38 - 0.43 * t],
      0.006,
      0x282b29,
    )
  }
  for (let i = 0; i < 17; i++) {
    const t = i / 16
    model.ball([0.445, 0.63 - 0.3 * t, 0.22 + 0.09 * Math.sin(t * Math.PI)], 0.005, 0x282b29)
  }
}

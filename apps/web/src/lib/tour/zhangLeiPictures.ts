import type * as Three from 'three'
import { ZhangLeiSurface, zhangLeiFrame } from './zhangLeiDetailSurface'

/** Original landscape silhouettes; no manga scan or identified painting is reproduced. */
export function dressZhangLeiPicture(
  _THREE: typeof Three,
  surface: ZhangLeiSurface,
  _index: number,
): void {
  const w = surface.width,
    h = surface.structure.height,
    z = surface.depth / 2 - 0.03
  surface.box([w, h, 0.025], [0, h / 2, z - 0.015], 0x5a4a37)
  zhangLeiFrame(surface, { width: w * 0.96, height: h * 0.95, y: h / 2, z, trim: 0.045 })
  if (!surface.structure.id.endsWith('-landscape')) {
    surface.box([w * 0.8, h * 0.8, 0.01], [0, h / 2, z + 0.01], 0xd9d1b8)
    for (let row = 0; row < 6; row++)
      surface.box([w * 0.62, 0.008, 0.008], [0, h * (0.7 - row * 0.08), z + 0.02], 0x6e6554)
    return
  }
  surface.box([w * 0.85, h * 0.8, 0.012], [0, h / 2, z + 0.01], 0xa2ab95)
  surface.box([w * 0.85, h * 0.18, 0.012], [0, h * 0.2, z + 0.02], 0x62786c)
  for (let i = 0; i < 10; i++) {
    const x = (i - 4.5) * w * 0.08
    surface.sphere(
      [w * 0.065, h * (0.09 + (i % 3) * 0.05), 0.008],
      [x, h * (0.3 + (i % 3) * 0.11), z + 0.025],
      i % 2 ? 0x596452 : 0x78836a,
    )
  }
}

import type * as Three from 'three'
import {
  ZHANG_LEI_GOLD,
  ZHANG_LEI_WOOD,
  ZhangLeiSurface,
  zhangLeiFrame,
} from './zhangLeiDetailSurface'

/** Original procedural relief framing for official royal decree document. */
export function dressZhangLeiPicture(
  _THREE: typeof Three,
  surface: ZhangLeiSurface,
  _index: number,
): void {
  const w = surface.width
  const h = surface.structure.height
  const z = surface.depth / 2 + 0.04

  // Outer dark wood frame backing
  surface.box([w * 0.98, h * 0.98, 0.025], [0, h / 2, z - 0.01], ZHANG_LEI_WOOD)

  // Stepped golden moulding frame
  zhangLeiFrame(surface, { width: w * 0.94, height: h * 0.94, y: h / 2, z, trim: 0.07 })
  zhangLeiFrame(surface, { width: w * 0.86, height: h * 0.86, y: h / 2, z: z + 0.015, trim: 0.035 })

  // Parchment backing
  surface.box([w * 0.82, h * 0.82, 0.012], [0, h / 2, z + 0.01], 0xece3cb)

  // Stylized royal coat of arms / imperial seal at top
  surface.sphere([0.065, 0.065, 0.01], [0, h * 0.72, z + 0.02], 0x7c2622)
  surface.ring(0.065, [0, h * 0.72, z + 0.022], ZHANG_LEI_GOLD)
  surface.sphere([0.03, 0.03, 0.01], [0, h * 0.72, z + 0.026], ZHANG_LEI_GOLD)

  // Stylized calligraphic horizontal decree text lines
  const lineCount = 7
  for (let i = 0; i < lineCount; i++) {
    const lineY = h * 0.58 - (i * h * 0.38) / lineCount
    const lineW = w * (0.65 - (i % 3) * 0.08)
    surface.box([lineW, 0.012, 0.005], [0, lineY, z + 0.018], 0x3d352b)
  }
}

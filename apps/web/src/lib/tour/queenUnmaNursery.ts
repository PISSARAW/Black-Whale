import {
  UNMA_FABRIC_PALE,
  UNMA_GOLD,
  UNMA_LIGHT_WOOD,
  type QueenUnmaSurface,
} from './queenUnmaDetailSurface'

/** Partly visible nursery furniture, ch. 403 p. 10; hidden profiles and support are reconstructed. */
export function dressUnmaNursery(s: QueenUnmaSurface): void {
  if (s.structure.kind === 'mobile') {
    mobile(s)
    return
  }
  const { width: w, depth: d, structure } = s,
    h = structure.height
  for (const x of [-w * 0.46, w * 0.46])
    for (const z of [-d * 0.46, d * 0.46]) {
      s.cylinder({ radius: 0.035, height: h }, [x, h / 2, z], UNMA_LIGHT_WOOD)
      s.sphere([0.05, 0.05, 0.05], [x, h, z], UNMA_LIGHT_WOOD)
    }
  for (const side of [-1, 1]) {
    for (const y of [0.3, h * 0.88])
      s.box([0.035, 0.04, d * 0.88], [side * w * 0.46, y, 0], UNMA_LIGHT_WOOD)
    for (let n = 0; n < 8; n++)
      s.cylinder(
        { radius: 0.012, height: h * 0.57 },
        [side * w * 0.46, h * 0.59, (n / 7 - 0.5) * d * 0.83],
        UNMA_LIGHT_WOOD,
      )
    s.box([w * 0.9, h * 0.55, 0.045], [0, h * 0.57, side * d * 0.46], UNMA_LIGHT_WOOD)
  }
  s.box([w * 0.85, 0.1, d * 0.85], [0, 0.33, 0], UNMA_FABRIC_PALE)
  s.sphere([w * 0.3, 0.05, 0.15], [0, 0.43, -d * 0.25], UNMA_FABRIC_PALE)
}
function mobile(s: QueenUnmaSurface): void {
  const h = s.structure.height,
    w = s.width * 0.75
  s.box([w, 0.015, 0.015], [0, h * 0.5, 0], UNMA_GOLD)
  s.box([0.015, 0.015, w], [0, h * 0.5, 0], UNMA_GOLD)
  s.curve(
    [
      [w * 0.6, -0.35, 0],
      [w * 0.6, h * 0.9, 0],
      [0, h * 0.95, 0],
      [0, h * 0.5, 0],
    ],
    0.012,
    UNMA_LIGHT_WOOD,
  )
  for (const [x, z] of [
    [-w * 0.4, 0],
    [w * 0.4, 0],
    [0, -w * 0.4],
    [0, w * 0.4],
  ]) {
    s.cylinder({ radius: 0.004, height: h * 0.3 }, [x, h * 0.35, z], UNMA_LIGHT_WOOD)
    s.sphere([0.04, 0.05, 0.04], [x, h * 0.18, z], UNMA_GOLD)
  }
}

import type { MangaHairKit } from './mangaHair'
import { salesaleSkullGeometry } from './mangaSalesaleGeometry'

/** Short blond sides and the swept, curling forelock in the supplied portrait. */
export function mangaSalesaleHair(kit: MangaHairKit) {
  const { THREE } = kit
  const scalp = salesaleSkullGeometry(THREE).scale(1.02, 1, 1.035).translate(0, 0.006, 0)
  const p = scalp.getAttribute('position'),
    index = scalp.index!,
    triangles: number[] = []
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
    const side = ids.every(
      (id) =>
        p.getY(id) > -0.004 &&
        (p.getY(id) > 0.22 ||
          p.getZ(id) < 0.025 ||
          (p.getY(id) < 0.205 && Math.abs(p.getX(id)) > 0.143)),
    )
    if (side) triangles.push(...ids)
  }
  scalp.setIndex(triangles)
  kit.parts.push(scalp)
  for (let i = 0; i < 9; i++) {
    const offset = i * 0.012
    kit.lock({
      width: 0.018,
      depth: 0.012,
      points: [
        [0.131 - offset, 0.187, 0.127],
        [0.095 - offset, 0.285, 0.11],
        [-0.025 - offset * 0.55, 0.31, 0.13],
        [-0.12 - offset * 0.35, 0.284, 0.14],
        [-0.19 - offset * 0.15, 0.303, 0.115],
        [-0.196 - offset * 0.13, 0.356 + offset * 0.2, 0.1],
      ],
    })
  }
  for (const [x, z] of [
    [-0.07, 0.025],
    [0.064, -0.025],
  ])
    kit.lock({
      width: 0.029,
      depth: 0.014,
      points: [
        [x + 0.025, 0.244, z],
        [x - 0.026, 0.315, z],
        [x - 0.025, 0.366, z],
        [x - 0.004, 0.401, z - 0.01],
      ],
    })
  // addMangaHair restores the profile's cheek width after building in its standard space.
  for (const part of kit.parts) part.scale(0.155 / 0.19, 1, 1)
}

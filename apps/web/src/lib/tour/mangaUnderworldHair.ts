import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

export function mangaBraidedHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  const scalp = mangaScalpGeometry(kit)
  const positions = scalp.getAttribute('position')
  const source = scalp.index!
  const triangles = []
  for (let i = 0; i < source.count; i += 3) {
    const ids = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    if (ids.some((id) => positions.getZ(id) < 0.015 || Math.abs(positions.getX(id)) > 0.13))
      triangles.push(...ids)
  }
  scalp.setIndex(triangles)
  parts.push(scalp)
  for (let i = 0; i < 9; i++) {
    const x = Math.sin(i * Math.PI) * 0.015 + (i % 2 ? 0.012 : -0.012)
    parts.push(
      new THREE.SphereGeometry(1, 12, 10)
        .scale(0.045 - i * 0.002, 0.047, 0.038)
        .rotateZ(i % 2 ? 0.4 : -0.4)
        .translate(x, 0.07 - i * 0.073, -0.18),
    )
  }
}

export function mangaLongCurls(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1])
    for (let strand = 0; strand < 5; strand++) {
      const points = []
      for (let i = 0; i <= 42; i++) {
        const t = i / 42
        points.push(
          new THREE.Vector3(
            side *
              (0.12 + Math.sin(t * Math.PI) * 0.08 + Math.sin(t * Math.PI * 6 + strand) * 0.028),
            0.18 - t * (0.94 + strand * 0.041),
            0.02 - strand * 0.035 - t * 0.065 + Math.cos(t * Math.PI * 6 + strand) * 0.03,
          ),
        )
      }
      parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, 0.023, 7, false))
    }
  kit.lock({
    width: 0.036,
    depth: 0.019,
    points: [
      [-0.12, 0.2, 0.04],
      [-0.03, 0.22, 0.15],
      [0.1, 0.14, 0.19],
      [0.22, 0.21, 0.17],
      [0.19, 0.27, 0.14],
    ],
  })
}

export function mangaWingedPart(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1])
    for (let i = 0; i < 5; i++) {
      kit.lock({
        width: 0.039,
        depth: 0.018,
        points: [
          [side * 0.013, 0.2, 0.02 - i * 0.033],
          [side * 0.12, 0.12, 0.17 - i * 0.04],
          [side * 0.25, 0.06 - i * 0.013, 0.17 - i * 0.04],
          [side * (0.235 + (i % 2) * 0.02), 0.095 - i * 0.016, 0.13 - i * 0.04],
        ],
      })
    }
}

export function mangaFlameCrest(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    const x = Math.cos(a) * 0.14,
      z = Math.sin(a) * 0.13
    kit.lock({
      width: 0.029,
      depth: 0.02,
      points: [
        [x, 0.11, z],
        [x * 1.4, 0.22, z * 1.4],
        [x * 1.65 + 0.025, 0.27 + (i % 3) * 0.03, z * 1.5],
        [x * 1.1 - 0.016, 0.289 + (i % 4) * 0.02, z * 1.2],
        [x * 1.35 + 0.02, 0.34 + (i % 3) * 0.018, z * 1.45],
      ],
    })
  }
}

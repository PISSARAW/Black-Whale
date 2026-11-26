import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

type Hair = (kit: MangaHairKit) => void

function shoulderWaves(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (const side of [-1, 1])
    for (let lock = 0; lock < 8; lock++) {
      const z = 0.123 - lock * 0.033
      kit.lock({
        width: 0.032,
        depth: 0.022,
        points: [
          [side * 0.021, 0.212, z * 0.75],
          [side * 0.158, 0.119, z],
          [side * 0.198, -0.033, z + 0.014],
          [side * 0.169, -0.139, z - 0.042],
          [side * 0.218, -0.264, z - 0.028],
          [side * (0.191 + lock * 0.005), -0.385 - (lock % 3) * 0.027, z - 0.059],
        ],
      })
    }
}

function mishaBob(kit: MangaHairKit) {
  const { THREE } = kit
  const scalp = mangaScalpGeometry(kit)
  const positions = scalp.getAttribute('position')
  const indices = scalp.index!
  const triangles: number[] = []
  for (let i = 0; i < indices.count; i += 3) {
    const triangle = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)]
    if (
      triangle.every(
        (corner) =>
          positions.getZ(corner) <= 0.091 ||
          positions.getY(corner) > 0.127 ||
          Math.abs(positions.getX(corner)) > 0.048,
      )
    )
      triangles.push(...triangle)
  }
  scalp.setIndex(triangles)
  kit.parts.push(scalp)
  kit.parts.push(
    new THREE.LatheGeometry(
      [
        [0.145, -0.168],
        [0.173, -0.12],
        [0.176, 0.05],
        [0.154, 0.175],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      32,
      0.91,
      Math.PI * 2 - 1.82,
    ).scale(1, 1, 0.96),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++) {
      const x = 0.027 + i * 0.021
      kit.lock({
        width: 0.021,
        depth: 0.015,
        points: [
          [side * x * 0.69, 0.212, 0.039],
          [side * x, 0.173, 0.137 - i * 0.008],
          [side * (x + 0.009), i < 2 ? 0.112 - i * 0.014 : 0.043 - i * 0.009, 0.171 - i * 0.011],
        ],
      })
    }
}

function shortTousled(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = 0; i < 23; i++) {
    const angle = (i / 23) * 2 * Math.PI
    const x = Math.cos(angle) * 0.117
    const z = Math.sin(angle) * 0.12
    kit.lock({
      width: 0.017,
      depth: 0.014,
      points: [
        [x, 0.163, z],
        [x * 1.38, 0.196, z * 1.38],
        [x * 1.29 - 0.017, 0.239 + (i % 4) * 0.012, z * 1.25],
      ],
    })
  }
}

export const LOWER_DECK_HAIR: Partial<Record<string, Hair>> = {
  'misha-hao': mishaBob,
  sodom: shoulderWaves,
  bille: shortTousled,
}

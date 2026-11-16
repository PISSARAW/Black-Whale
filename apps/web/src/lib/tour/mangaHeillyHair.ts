import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

/** Luini's close slicked cut and Yokotani's fuller shoulder-length bob share a swept hairline. */
export function mangaHeillyHair(kit: MangaHairKit, bob: boolean) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(
    new THREE.SphereGeometry(bob ? 0.195 : 0.178, 32, 20, 0, Math.PI * 2, 0, 1.3)
      .scale(1, bob ? 1.18 : 1.12, 0.92)
      .translate(0, 0.035, -0.015),
  )
  for (let i = -7; i <= 7; i++) {
    const x = i * 0.021
    kit.lock({
      width: 0.018,
      depth: 0.01,
      points: [
        [x, 0.102 + (1 - Math.abs(i) / 8) * 0.018, 0.145],
        [x * 1.02, 0.21 - Math.abs(x) * 0.2, 0.09],
        [x * 0.95, 0.235 - Math.abs(x) * 0.3, -0.035],
        [x * 0.9, 0.13, -0.15],
      ],
    })
  }
  if (!bob) return
  parts.push(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.17, -0.32),
        new THREE.Vector2(0.197, -0.25),
        new THREE.Vector2(0.197, -0.05),
        new THREE.Vector2(0.17, 0.11),
      ],
      32,
      0.88,
      Math.PI * 2 - 1.76,
    ).scale(1, 1, 0.84),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++)
      kit.lock({
        width: 0.023,
        depth: 0.01,
        points: [
          [side * 0.11, 0.18, -i * 0.02],
          [side * 0.177, 0.05, 0.06 - i * 0.03],
          [side * 0.202, -0.2, 0.07 - i * 0.03],
          [side * 0.18, -0.32 - (i % 2) * 0.012, 0.03 - i * 0.03],
        ],
      })
}

import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

export function mangaBiscuitHair(kit: MangaHairKit, adult: boolean) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  for (let i = -5; i <= 5; i++)
    kit.lock({
      width: 0.019,
      depth: 0.01,
      points: [
        [i * 0.011, 0.21, 0.045],
        [i * 0.018, 0.16, 0.15],
        [i * 0.022, 0.095, 0.18],
        [i * 0.021, adult ? 0.055 + Math.abs(i % 3) * 0.02 : 0.05, 0.177],
      ],
    })
  for (const side of [-1, 1]) {
    if (adult) {
      for (let i = 0; i < 10; i++)
        parts.push(
          new THREE.SphereGeometry(1, 12, 10)
            .scale(0.024 - i * 0.001, 0.035, 0.024)
            .rotateZ((i % 2 ? 0.5 : -0.5) * side)
            .translate(
              side * (0.155 + Math.sin(i * 0.5) * 0.01),
              0.1 - i * 0.065,
              0.025 + i * 0.015,
            ),
        )
    } else {
      for (let strand = 0; strand < 6; strand++)
        kit.lock({
          width: 0.027,
          depth: 0.014,
          points: [
            [side * 0.13, 0.2, -0.02 - strand * 0.02],
            [side * 0.22, 0.03, -0.02 - strand * 0.02],
            [side * 0.25, -0.25, -0.01 - strand * 0.02],
            [side * (0.23 + strand * 0.008), -0.52, 0.02 - strand * 0.02],
          ],
        })
    }
  }
}

import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

export function mangaBiscuitHair(kit: MangaHairKit, adult: boolean) {
  kit.parts.push(mangaScalpGeometry(kit))
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
  if (adult) adultBraids(kit)
  else lacedBun(kit)
}

function adultBraids({ THREE, parts }: MangaHairKit) {
  for (const side of [-1, 1])
    for (let i = 0; i < 10; i++)
      parts.push(
        new THREE.SphereGeometry(1, 12, 10)
          .scale(0.024 - i * 0.001, 0.035, 0.024)
          .rotateZ((i % 2 ? 0.5 : -0.5) * side)
          .translate(side * (0.155 + Math.sin(i * 0.5) * 0.01), 0.1 - i * 0.065, 0.025 + i * 0.015),
      )
}

function lacedBun(kit: MangaHairKit) {
  const { THREE, parts } = kit
  for (const side of [-1, 1]) {
    for (let strand = 0; strand < 4; strand++)
      kit.lock({
        width: 0.022,
        depth: 0.012,
        points: [
          [side * (0.055 + strand * 0.018), 0.21, 0.02 - strand * 0.025],
          [side * (0.1 + strand * 0.012), 0.25, -0.08 - strand * 0.018],
          [side * (0.07 + strand * 0.008), 0.23, -0.18 - strand * 0.012],
          [side * (0.035 + strand * 0.006), 0.18, -0.22],
        ],
      })
    for (let curl = 0; curl < 3; curl++)
      kit.lock({
        width: 0.018,
        depth: 0.01,
        points: [
          [side * 0.145, 0.13, 0.08 - curl * 0.025],
          [side * 0.18, 0.02, 0.12 - curl * 0.018],
          [side * 0.145, -0.13, 0.15 - curl * 0.012],
          [side * 0.175, -0.24, 0.13 - curl * 0.01],
        ],
      })
  }
  parts.push(new THREE.SphereGeometry(1, 20, 14).scale(0.145, 0.11, 0.105).translate(0, 0.22, -0.2))
  for (let coil = 0; coil < 4; coil++)
    parts.push(
      new THREE.TorusGeometry(0.095 - coil * 0.015, 0.012, 7, 28)
        .scale(1.15, 0.82, 1)
        .rotateY(coil * 0.38)
        .translate(0, 0.225, -0.29 - coil * 0.004),
    )
}

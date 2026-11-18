import type { BufferGeometry } from 'three'
import type { MangaHairKit } from './mangaHair'

function centrePart(scalp: BufferGeometry) {
  const positions = scalp.getAttribute('position'),
    source = scalp.index!,
    triangles: number[] = []
  for (let i = 0; i < source.count; i += 3) {
    const ids = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    const forehead = ids.some((id) => {
      const x = positions.getX(id),
        y = positions.getY(id)
      return positions.getZ(id) > 0.025 && y < 0.222 - Math.abs(x) * 0.82
    })
    if (!forehead) triangles.push(...ids)
  }
  scalp.setIndex(triangles)
  return scalp
}

/** Long back fall and layered, upturned collarbone locks from the supplied panels. */
export function mangaMorenaHair(kit: MangaHairKit) {
  const { THREE } = kit
  kit.parts.push(
    centrePart(
      new THREE.SphereGeometry(0.177, 40, 24).scale(1, 1.32, 1).translate(0, 0.006, -0.005),
    ),
  )
  kit.parts.push(
    new THREE.LatheGeometry(
      [
        [0.185, -1.13],
        [0.215, -0.99],
        [0.205, -0.65],
        [0.19, -0.3],
        [0.173, 0.06],
        [0.154, 0.16],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      36,
      1.18,
      Math.PI * 2 - 2.36,
    ).scale(1, 1, 0.84),
  )
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const z = 0.04 - i * 0.024
      kit.lock({
        width: 0.025,
        depth: 0.008,
        points: [
          [side * 0.095, 0.105, z * 0.7],
          [side * 0.17, -0.04, z - 0.025],
          [side * 0.205, -0.72, z - 0.035],
          [side * (0.19 + (i % 3) * 0.008), -1.14 + (i % 3) * 0.015, z - 0.02],
        ],
      })
    }
    for (let i = 0; i < 3; i++) {
      const length = 0.34 + i * 0.11
      kit.lock({
        width: 0.036,
        depth: 0.01,
        points: [
          [side * (0.018 + i * 0.024), 0.226 - i * 0.012, 0.026 - i * 0.006],
          [side * (0.145 + i * 0.019), 0.035, 0.155 - i * 0.018],
          [side * (0.17 + i * 0.036), -length + 0.13, 0.155],
          [side * (0.17 + i * 0.036), -length, 0.197],
          [side * (0.107 + i * 0.028), -length + 0.015, 0.223],
          [side * (0.1 + i * 0.028), -length + 0.065, 0.223],
        ],
      })
    }
  }
}

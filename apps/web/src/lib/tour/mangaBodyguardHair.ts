import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

/** Bill’s separated flame locks leave his angular, double-pointed hairline exposed. */
export function mangaBillFlames(kit: MangaHairKit) {
  const { THREE, parts } = kit
  const cap = mangaScalpGeometry(kit)
  const position = cap.getAttribute('position'),
    source = cap.index!
  const triangles = []
  for (let i = 0; i < source.count; i += 3) {
    const ids = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    if (
      !ids.some(
        (id) =>
          position.getZ(id) > 0.07 &&
          position.getY(id) < 0.158 - Math.abs(position.getX(id)) * 0.35,
      )
    )
      triangles.push(...ids)
  }
  cap.setIndex(triangles)
  parts.push(cap)
  for (let i = 0; i < 21; i++) {
    const angle = (i * Math.PI * 2) / 21
    const x = Math.cos(angle) * 0.145,
      z = Math.sin(angle) * 0.12
    const height = 0.34 + (i % 4) * 0.032
    kit.lock({
      width: 0.032,
      depth: 0.024,
      points: [
        [x, 0.095, z],
        [x * 1.32, 0.19, z * 1.22],
        [x * 1.48 + 0.018, height - 0.09, z * 1.2],
        [x * 1.22 - 0.02, height - 0.04, z * 1.18],
        [x * 1.32, height + 0.015, z * 1.18],
      ],
    })
  }
  for (const side of [-1, 1])
    kit.lock({
      width: 0.028,
      depth: 0.014,
      points: [
        [side * 0.12, 0.19, 0.1],
        [side * 0.11, 0.18, 0.154],
        [side * 0.07, 0.137, 0.168],
        [side * 0.02, 0.16, 0.172],
      ],
    })
  parts.push(
    new THREE.SphereGeometry(1, 20, 12).scale(0.12, 0.13, 0.125).translate(0, 0.235, -0.025),
  )
}

/** Basho’s quiff is a rounded swept roll, with a central curl and close-cut temples. */
export function mangaBashoPompadour(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(
    new THREE.SphereGeometry(1, 28, 18).scale(0.182, 0.109, 0.139).translate(0, 0.247, -0.005),
  )
  for (const side of [-1, 1]) {
    parts.push(
      new THREE.SphereGeometry(1, 24, 16)
        .scale(0.113, 0.115, 0.139)
        .rotateZ(side * -0.16)
        .translate(side * 0.087, 0.235, -0.005),
    )
    for (let i = 0; i < 6; i++)
      kit.lock({
        width: 0.025,
        depth: 0.015,
        points: [
          [side * 0.153, -0.015, 0.08 - i * 0.024],
          [side * 0.175, 0.09, 0.1 - i * 0.024],
          [side * 0.15, 0.23, 0.11 - i * 0.02],
          [side * 0.08, 0.3, 0.1 - i * 0.015],
        ],
      })
  }
  parts.push(
    new THREE.SphereGeometry(1, 28, 20).scale(0.115, 0.103, 0.105).translate(0, 0.222, 0.087),
  )
  for (let i = -1; i <= 1; i++)
    kit.lock({
      width: 0.009,
      depth: 0.005,
      points: [
        [i * 0.02, 0.18, 0.16],
        [i * 0.023, 0.14, 0.177],
        [i * 0.018 + 0.008, 0.09, 0.18],
        [i * 0.021, 0.075, 0.18],
      ],
    })
}

import type { BufferGeometry } from 'three'
import type { MangaHairKit } from './mangaHair'
import { luzurusSkullGeometry } from './mangaLuzurusGeometry'

function highHairline(scalp: BufferGeometry) {
  const positions = scalp.getAttribute('position'),
    source = scalp.index!,
    triangles: number[] = []
  for (let i = 0; i < source.count; i += 3) {
    const ids = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    const forehead = ids.some(
      (id) =>
        positions.getZ(id) > 0.035 &&
        positions.getY(id) < 0.173 - Math.abs(positions.getX(id)) * 0.55,
    )
    if (!forehead) triangles.push(...ids)
  }
  scalp.setIndex(triangles)
  return scalp
}

function curlyPuff(kit: MangaHairKit, side: number) {
  const { THREE, parts } = kit
  const center = side * 0.33
  parts.push(
    new THREE.SphereGeometry(1, 24, 16).scale(0.113, 0.103, 0.095).translate(center, 0.065, -0.015),
  )
  for (let i = 0; i < 42; i++) {
    const y = 1 - (2 * (i + 0.5)) / 42,
      radius = Math.sqrt(1 - y * y),
      angle = i * 2.399963
    const x = Math.cos(angle) * radius,
      z = Math.sin(angle) * radius
    parts.push(
      new THREE.SphereGeometry(0.027 + (i % 3) * 0.002, 12, 8)
        .scale(1.05, 0.95, 0.9)
        .translate(center + x * 0.109, 0.065 + y * 0.097, -0.015 + z * 0.09),
    )
    if (i % 2 === 0)
      parts.push(
        new THREE.TorusGeometry(0.018, 0.005, 5, 14, Math.PI * 1.8)
          .rotateZ(i * 0.81)
          .translate(center + x * 0.103, 0.065 + y * 0.09, 0.088),
      )
  }
}

/** Swept parallel ridges meet the two round, densely curled side puffs. */
export function mangaLuzurusHair(kit: MangaHairKit) {
  const { THREE } = kit
  const surface = luzurusSkullGeometry(THREE).scale(1.025, 1, 1.035).translate(0, 0.006, 0)
  kit.parts.push(highHairline(surface.clone()))
  const material = new THREE.MeshBasicMaterial(),
    mesh = new THREE.Mesh(surface, material)
  const ray = new THREE.Raycaster()
  for (let i = -7; i <= 7; i++) {
    const x = i * 0.019
    kit.lock({
      width: 0.0065,
      depth: 0.0045,
      points: Array.from({ length: 12 }, (_, step) => {
        const angle = 0.72 + (step / 11) * 2.2
        const origin = new THREE.Vector3(x, 0.03 + Math.sin(angle) * 0.4, Math.cos(angle) * 0.4)
        const direction = new THREE.Vector3(0, -Math.sin(angle), -Math.cos(angle))
        ray.set(origin, direction)
        const point = ray.intersectObject(mesh)[0]!.point.addScaledVector(direction, -0.003)
        return [point.x, point.y, point.z] as const
      }),
    })
  }
  for (const side of [-1, 1]) curlyPuff(kit, side)
  surface.dispose()
  material.dispose()
}

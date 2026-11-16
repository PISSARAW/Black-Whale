import type { Three } from './silentMajorityParts'
import type { Point3 } from './kurapikaGeometry'

/** Raised gold piping and monkey-scroll ornaments, shared by every Saiyu rig. */
export function saiyuCurve(THREE: Three, points: readonly Point3[], radius = 0.006) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    32,
    radius,
    7,
    false,
  )
}

export function saiyuScroll(
  THREE: Three,
  options: { radius: number; tube: number; at: Point3; side?: number },
) {
  const points: Point3[] = []
  for (let i = 0; i <= 48; i++) {
    const t = i / 48
    const angle = t * Math.PI * 3.2
    const r = options.radius * (1 - t * 0.88)
    points.push([Math.cos(angle) * r * (options.side ?? 1), Math.sin(angle) * r, 0])
  }
  return saiyuCurve(THREE, points, options.tube).translate(...options.at)
}

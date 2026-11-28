import { Color, Float32BufferAttribute, SphereGeometry, Vector3 } from 'three'

export function createJupiterSurface() {
  const shape = new SphereGeometry(1, 96, 64)
  const vertices = shape.getAttribute('position')
  const sand = new Color(0xe6c9a1)
  const umber = new Color(0xa76f5b)
  const rust = new Color(0x9b493b)
  const lit = new Color()
  const point = new Vector3()
  const keyLight = new Vector3(-0.48, 0.72, 0.56).normalize()
  const colours: number[] = []
  for (let index = 0; index < vertices.count; index++) {
    point.fromBufferAttribute(vertices, index)
    const { x, y, z } = point
    const longitude = Math.atan2(z, x)
    const spot = Math.hypot((x - 0.38) / 0.27, (y + 0.29) / 0.115)
    const eye = z > 0 ? Math.max(0, 1 - spot) : 0
    const latitude =
      y + Math.sin(4 * longitude + y * 15) * 0.024 + Math.sin(11 * longitude - y * 8) * 0.009
    const belt = Math.sin(latitude * 30 + eye * 4) * 0.29 + Math.sin(latitude * 72) * 0.15
    const fibre = Math.sin(latitude * 145 + Math.sin(longitude * 13)) * 0.045
    lit
      .copy(sand)
      .lerp(umber, 0.47 + belt + fibre)
      .lerp(rust, Math.min(0.9, eye * 2.1))
    lit.multiplyScalar(0.44 + Math.max(0, point.dot(keyLight)) * 0.59)
    colours.push(lit.r, lit.g, lit.b)
  }
  shape.setAttribute('color', new Float32BufferAttribute(colours, 3))
  return shape
}

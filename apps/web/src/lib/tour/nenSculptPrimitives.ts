import type { BasicApparitionContext } from './apparitionBasicView'
import { BONE, INK, modelKit, type Point } from './nenModelPrimitives'

/** Contoured volumes and tapered curves, rather than overlapping equal-width balls. */
export function sculptKit(context: BasicApparitionContext, size: number) {
  const k = modelKit(context, size)
  const { THREE } = context
  const loft = ({
    name,
    sections,
    colour,
    at = [0, 0, 0],
  }: {
    name: string
    /** Height, half width, half depth and depth offset, from bottom to top. */
    sections: readonly (readonly [number, number, number, number])[]
    colour: number
    at?: Point
  }) => {
    const vertices: number[] = [],
      indices: number[] = [],
      uvs: number[] = [],
      segments = 32
    sections.forEach(([y, width, depth, offset], row) => {
      for (let i = 0; i <= segments; i++) {
        const angle = (i * Math.PI * 2) / segments
        vertices.push(
          width * Math.cos(angle) * size,
          y * size,
          (offset + depth * Math.sin(angle)) * size,
        )
        uvs.push(i / segments, row / (sections.length - 1))
        if (row > 0 && i < segments) {
          const a = row * (segments + 1) + i,
            b = a - segments - 1
          indices.push(a, a + 1, b, b, a + 1, b + 1)
        }
      }
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return k.add({ geometry, colour, at, name })
  }
  const taper = ({
    name,
    points,
    radii,
    colour,
  }: {
    name: string
    points: readonly Point[]
    radii: readonly number[]
    colour: number
  }) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
    const steps = Math.max(16, points.length * 5),
      sides = 8
    const frames = curve.computeFrenetFrames(steps, false)
    const vertices: number[] = [],
      indices: number[] = [],
      uvs: number[] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        sample = t * (radii.length - 1),
        lower = Math.floor(sample)
      const radius = THREE.MathUtils.lerp(
        radii[lower],
        radii[Math.min(lower + 1, radii.length - 1)],
        sample - lower,
      )
      const centre = curve.getPoint(t)
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * Math.PI * 2
        const p = centre
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * radius)
          .addScaledVector(frames.binormals[i], Math.sin(a) * radius)
          .multiplyScalar(size)
        vertices.push(...p.toArray())
        uvs.push(j / sides, t)
        if (i > 0 && j < sides) {
          const a = i * (sides + 1) + j,
            b = a - sides - 1
          indices.push(a, b, a + 1, b, b + 1, a + 1)
        }
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return k.add({ geometry, name, colour, at: [0, 0, 0] })
  }
  const almond = ({
    name,
    at,
    width,
    height,
    iris = INK,
  }: {
    name: string
    at: Point
    width: number
    height: number
    iris?: number
  }) => {
    const shape = new THREE.Shape()
    shape.moveTo(-width, 0)
    shape.bezierCurveTo(-width * 0.45, height * 1.3, width * 0.5, height, width, 0)
    shape.bezierCurveTo(width * 0.5, -height, -width * 0.5, -height, -width, 0)
    k.add({
      name: `${name}-sclera`,
      at,
      colour: BONE,
      geometry: new THREE.ShapeGeometry(shape, 20).scale(size, size, size),
    })
    k.oval({
      name: `${name}-iris`,
      at: [at[0], at[1], at[2] + 0.008],
      radii: [height * 0.62, height * 0.88, 0.009],
      colour: iris,
    })
    k.tube({
      name: `${name}-upper-lid`,
      points: [
        [at[0] - width, at[1], at[2] + 0.005],
        [at[0] - width * 0.25, at[1] + height * 0.78, at[2] + 0.012],
        [at[0] + width, at[1], at[2] + 0.005],
      ],
      radius: height * 0.12,
      colour: INK,
    })
  }
  return { ...k, loft, taper, almond }
}

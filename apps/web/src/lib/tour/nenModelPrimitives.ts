import type { Object3D } from 'three'
import type { BasicApparitionContext } from './apparitionBasicView'

export type Point = readonly [number, number, number]
export const INK = 0x171318
export const BONE = 0xeee9dd

/** Small modelling vocabulary shared by the manga manifestations. All coordinates are local. */
export function modelKit({ THREE, glow, root }: BasicApparitionContext, size = 1) {
  const v = (p: Point) => new THREE.Vector3(...p).multiplyScalar(size)
  const material = (colour: number) => glow(colour, 1)
  const add = ({
    geometry,
    colour,
    at,
    name,
    into = root,
  }: {
    geometry: import('three').BufferGeometry
    colour: number
    at: Point
    name: string
    into?: Object3D
  }) => {
    const mesh = new THREE.Mesh(geometry, material(colour))
    mesh.name = name
    mesh.position.copy(v(at))
    into.add(mesh)
    return mesh
  }
  const oval = ({
    name,
    at,
    radii,
    colour,
    into = root,
  }: {
    name: string
    at: Point
    radii: Point
    colour: number
    into?: Object3D
  }) => {
    const mesh = add({
      geometry: new THREE.SphereGeometry(size, 20, 14),
      colour: colour,
      at: at,
      name: name,
      into: into,
    })
    mesh.scale.set(...radii)
    return mesh
  }
  const box = ({
    name,
    at,
    dimensions,
    colour,
    into = root,
  }: {
    name: string
    at: Point
    dimensions: Point
    colour: number
    into?: Object3D
  }) =>
    add({
      geometry: new THREE.BoxGeometry(
        ...(dimensions.map((x) => x * size) as [number, number, number]),
      ),
      colour: colour,
      at: at,
      name: name,
      into: into,
    })
  const tube = ({
    name,
    points,
    radius,
    colour,
    into = root,
  }: {
    name: string
    points: readonly Point[]
    radius: number
    colour: number
    into?: Object3D
  }) => {
    const curve = new THREE.CatmullRomCurve3(points.map(v))
    return add({
      geometry: new THREE.TubeGeometry(
        curve,
        Math.max(12, points.length * 5),
        radius * size,
        8,
        false,
      ),
      colour: colour,
      at: [0, 0, 0],
      name: name,
      into: into,
    })
  }
  const spike = ({
    name,
    from,
    to,
    radius,
    colour,
    into = root,
  }: {
    name: string
    from: Point
    to: Point
    radius: number
    colour: number
    into?: Object3D
  }) => {
    const start = v(from),
      end = v(to)
    const mesh = add({
      geometry: new THREE.ConeGeometry(radius * size, start.distanceTo(end), 10),
      colour: colour,
      at: [0, 0, 0],
      name: name,
      into: into,
    })
    mesh.position.copy(start).lerp(end, 0.5)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize())
    return mesh
  }
  const patch = ({
    name,
    points,
    at,
    colour,
    into = root,
    depth = 0.025,
  }: {
    name: string
    points: readonly (readonly [number, number])[]
    at: Point
    colour: number
    into?: Object3D
    depth?: number
  }) => {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x * size, y * size)))
    const mesh = add({
      geometry: new THREE.ExtrudeGeometry(shape, {
        depth: depth * size,
        bevelEnabled: false,
        curveSegments: 16,
      }),
      colour: colour,
      at: at,
      name: name,
      into: into,
    })
    return mesh
  }
  const heart = ({
    name,
    at,
    width,
    colour,
    into = root,
  }: {
    name: string
    at: Point
    width: number
    colour: number
    into?: Object3D
  }) => {
    const shape = new THREE.Shape()
    shape.moveTo(0, -width * 0.55)
    shape.bezierCurveTo(-width, 0.1 * width, -width * 0.45, width * 0.75, 0, width * 0.32)
    shape.bezierCurveTo(width * 0.45, width * 0.75, width, width * 0.1, 0, -width * 0.55)
    const mesh = add({
      geometry: new THREE.ExtrudeGeometry(shape, {
        depth: 0.025,
        bevelEnabled: false,
        curveSegments: 16,
      }).scale(size, size, size),
      colour: colour,
      at: at,
      name: name,
      into: into,
    })
    return mesh
  }
  const eye = ({
    name,
    at,
    radius,
    into = root,
  }: {
    name: string
    at: Point
    radius: number
    into?: Object3D
  }) => {
    oval({
      name: `${name}-white`,
      at: at,
      radii: [radius, radius * 0.85, radius * 0.35],
      colour: BONE,
      into: into,
    })
    oval({
      name: `${name}-pupil`,
      at: [at[0], at[1], at[2] + radius * 0.32],
      radii: [radius * 0.42, radius * 0.68, radius * 0.13],
      colour: INK,
      into: into,
    })
  }
  const hand = ({
    name,
    at,
    scale,
    colour,
    into = root,
    fingers = 5,
  }: {
    name: string
    at: Point
    scale: number
    colour: number
    into?: Object3D
    fingers?: number
  }) => {
    oval({
      name: `${name}-palm`,
      at: at,
      radii: [scale * 0.18, scale * 0.25, scale * 0.09],
      colour: colour,
      into: into,
    })
    for (let i = 0; i < fingers; i++) {
      const x = at[0] + (i - (fingers - 1) / 2) * scale * 0.085
      tube({
        name: `${name}-finger-${i}`,
        points: [
          [x, at[1] - scale * 0.12, at[2]],
          [x, at[1] - scale * (0.42 - Math.abs(i - 2) * 0.03), at[2] + scale * 0.03],
          [x, at[1] - scale * 0.46, at[2] + scale * 0.16],
        ],
        radius: scale * 0.033,
        colour: colour,
        into: into,
      })
    }
  }
  return { THREE, root, material, add, oval, box, tube, spike, patch, heart, eye, hand }
}

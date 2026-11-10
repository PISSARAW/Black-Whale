/**
 * What Kurapika's chains are cut from: the link, and the few solids a tip is
 * assembled out of.
 *
 * The reference is the databook plate of the hand — four of the five chains,
 * drawn flat and in colour — and the panels for the fifth. What they agree on is
 * that nothing here is a ring: a link is a rounded rectangle with a rectangular
 * hole, the steel is pale blue, the fittings are a deeper blue, and the blades
 * are nearly white. `chainTips.ts` is the five ends; this is the vocabulary.
 *
 * Every measure a caller passes is in pendulum-ball radii and is brought to
 * metres here, so a tip reads as proportions off the plate rather than as
 * centimetres.
 */
import type { BufferGeometry, Group, Material, MeshBasicMaterial, Path, Shape } from 'three'

type Three = typeof import('three')
type Triple = readonly [number, number, number]

/** The fittings: the caps on the cross, the guard of the dagger, the claw's ferrule. */
export const CHAIN_DEEP = 0x4f86c6
/** The Dowsing ball, which the plate draws far darker than the chain it hangs on. */
export const CHAIN_NAVY = 0x1d2148
/** The glint on that ball. */
export const CHAIN_GLINT = 0x8f9bd6
/** The blades — the dagger and the claw — which are the lightest things on the hand. */
export const CHAIN_SILVER = 0xeaf2fa
/** Slots, rivets and the ridge of a blade: the inked lines of the plate. */
export const CHAIN_SHADE = 0x2a3a5c
/** The barrel of the syringe. */
export const CHAIN_GLASS = 0xd8ecf8

/** What one tip is built from: the three.js namespace, the steel, and the scale. */
export interface TipContext {
  THREE: Three
  steel: MeshBasicMaterial
  /** The scene's shared flat materials, by colour and opacity. */
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  /** The pendulum ball's radius in metres — every tip is drawn to it. */
  size: number
}

interface RodSpec {
  from: number
  to: number
  /** One radius, or the radius at each end for a flared or tapered rod. */
  radius: number | readonly [number, number]
  material: Material
}

function roundedRectangle(path: Path, half: readonly [number, number], corner: number) {
  const [x, y] = half
  path.moveTo(-x + corner, -y)
  path.lineTo(x - corner, -y)
  path.quadraticCurveTo(x, -y, x, -y + corner)
  path.lineTo(x, y - corner)
  path.quadraticCurveTo(x, y, x - corner, y)
  path.lineTo(-x + corner, y)
  path.quadraticCurveTo(-x, y, -x, y - corner)
  path.lineTo(-x, -y + corner)
  path.quadraticCurveTo(-x, -y, -x + corner, -y)
}

/**
 * One link, long along Y with its hole through Z: a rounded rectangle of flat
 * bar, the way every panel draws it. `size` is the ball's radius in metres.
 */
export function chainLinkGeometry(THREE: Three, size: number): BufferGeometry {
  const bar = 0.065
  const outline = new THREE.Shape()
  roundedRectangle(outline, [0.13, 0.2], 0.06)
  const hole = new THREE.Path()
  roundedRectangle(hole, [0.13 - bar, 0.2 - bar], 0.025)
  outline.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: bar, bevelEnabled: false })
  geometry.translate(0, 0, -bar / 2)
  geometry.scale(size, size, size)
  return geometry
}

/**
 * The solids of a tip, all laid along +Z — the axis the scene turns onto the
 * run of the chain — with the flat of anything flat facing ±Y.
 */
export function tipKit(context: TipContext, group: Group = new context.THREE.Group()) {
  const { THREE, steel, size } = context
  const place = (geometry: BufferGeometry, material: Material, at: Triple) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(at[0] * size, at[1] * size, at[2] * size)
    group.add(mesh)
    return mesh
  }
  return {
    group,
    /** A round bar along the run, from one distance down the tip to another. */
    rod({ from, to, radius, material }: RodSpec) {
      const [near, far] = typeof radius === 'number' ? [radius, radius] : radius
      const length = (to - from) * size
      const mesh = place(
        new THREE.CylinderGeometry(far * size, near * size, length, 12),
        material,
        [0, 0, (from + to) / 2],
      )
      mesh.rotation.x = Math.PI / 2
      return mesh
    },
    /** The eye the last link passes through, seen open from the flat side. */
    loop(z: number, radius = 0.17) {
      const mesh = place(
        new THREE.TorusGeometry(radius * size, radius * 0.3 * size, 6, 14),
        steel,
        [0, 0, z],
      )
      mesh.rotation.x = Math.PI / 2
      return mesh
    },
    /** A stone or a rivet: a short round set through the flat, showing on both faces. */
    stud(radius: number, z: number, material: Material) {
      return place(
        new THREE.CylinderGeometry(radius * size, radius * size, 0.34 * size, 12),
        material,
        [0, 0, z],
      )
    },
    box(dims: Triple, at: Triple, material: Material) {
      return place(
        new THREE.BoxGeometry(dims[0] * size, dims[1] * size, dims[2] * size),
        material,
        at,
      )
    },
    ball(radius: number, at: Triple, material: Material) {
      return place(new THREE.SphereGeometry(radius * size, 28, 20), material, at)
    },
    /** A plate cut to an outline drawn in (across, along), lying in the flat. */
    flat(draw: (shape: Shape) => void, depth: number, material: Material) {
      const shape = new THREE.Shape()
      draw(shape)
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
      geometry.rotateX(Math.PI / 2)
      geometry.translate(0, depth / 2, 0)
      geometry.scale(size, size, size)
      return place(geometry, material, [0, 0, 0])
    },
    /** A second kit, starting `z` down the tip and turned in the flat by `angle`. */
    spoke(angle: number, z: number) {
      const arm = new THREE.Group()
      arm.position.z = z * size
      arm.rotation.y = angle
      group.add(arm)
      return tipKit(context, arm)
    },
  }
}

export type TipKit = ReturnType<typeof tipKit>

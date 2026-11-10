import type { BufferGeometry, Group, Material, MeshBasicMaterial } from 'three'
import type { HumanLook } from './humanFigure'
import type { FrameShape, HumanProfile } from './humanProfiles'
import { CANON } from './humanProportions'
import { prisonFootGeometry, prisonFootMaterial } from './humanPrisonProps'
import type { Geometry, Outlined, Three } from './silentMajorityParts'

/**
 * Arms and legs, drawn the way a panel draws them: tapering.
 *
 * They were capsules — one radius from joint to joint — so a leg was a pipe
 * with a box under it. A drawn limb is widest where it leaves the trunk and
 * narrowest at the wrist or the ankle, with one swelling on the way down, and
 * that taper is most of what separates a figure from a mannequin once the
 * proportions are right. The lengths come from `CANON`; nothing here chooses
 * one.
 *
 * The joint hierarchy is unchanged and load-bearing: a limb group holds its
 * upper segment first and its joint second, which is the order
 * `humanAnimation` reads the elbow in.
 */
export interface HumanLimbsBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  figure: Group
  seen: HumanLook
  profile: HumanProfile
  frame: FrameShape
  materials: { ink: Material; skin: Material; dark: Material }
}

export interface HumanLimbs {
  arms: Group[]
  legs: Group[]
  elbows: Group[]
  knees: Group[]
}

/** Radii sampled evenly from the upper joint to the lower one. */
type Taper = readonly number[]

const THIGH: Taper = [0.092, 0.088, 0.074, 0.062]
const SHIN: Taper = [0.06, 0.068, 0.056, 0.042]
const UPPER_ARM: Taper = [0.064, 0.06, 0.052, 0.047]
const FOREARM: Taper = [0.048, 0.052, 0.042, 0.034]

const SHOE_HEIGHT = 0.1
/** The shin stops at the ankle, the forearm at the wrist. */
const SHIN_LENGTH = CANON.shin - SHOE_HEIGHT + 0.01
const FOREARM_LENGTH = CANON.forearm - 0.045

interface Segment {
  key: string
  length: number
  taper: Taper
  colour: number
}

function taperedGeometry(THREE: Three, length: number, taper: Taper): BufferGeometry {
  // Bottom to top, so the faces turn outwards for the contour's inverted hull.
  const last = taper.length - 1
  const points = [new THREE.Vector2(0, -length / 2 - taper[last] * 0.6)]
  for (let i = last; i >= 0; i -= 1) {
    points.push(new THREE.Vector2(taper[i], -length / 2 + (1 - i / last) * length))
  }
  points.push(new THREE.Vector2(0, length / 2 + taper[0] * 0.6))
  return new THREE.LatheGeometry(points, 8)
}

function segment(build: HumanLimbsBuild, { key, length, taper, colour }: Segment): Group {
  const { THREE, geometry, outlined, glow, materials } = build
  const limb = outlined({
    THREE,
    geometry: geometry(THREE, `limb:${key}`, () => taperedGeometry(THREE, length, taper)),
    material: glow(colour, 1),
    ink: materials.ink,
    scale: 1.072,
  })
  limb.position.y = -length / 2
  return limb
}

/** A sole, a heel and a toe that comes down to a point: a wedge, not a brick. */
function shoeGeometry(THREE: Three): BufferGeometry {
  const side = new THREE.Shape()
  side.moveTo(-0.1, 0)
  side.lineTo(0.14, 0)
  side.lineTo(0.165, 0.02)
  side.lineTo(0.15, 0.05)
  side.lineTo(0.04, 0.085)
  side.lineTo(-0.02, SHOE_HEIGHT)
  side.lineTo(-0.1, SHOE_HEIGHT)
  side.closePath()
  const made = new THREE.ExtrudeGeometry(side, { depth: 0.11, bevelEnabled: false })
  made.rotateY(-Math.PI / 2)
  made.center()
  return made
}

function buildLeg(build: HumanLimbsBuild, side: number): { leg: Group; knee: Group } {
  const { THREE, geometry, outlined, seen, profile, frame, materials } = build
  const leg = new THREE.Group()
  leg.name = side < 0 ? 'hip-left' : 'hip-right'
  const trousers = profile.trousers
  leg.add(segment(build, { key: 'thigh', length: CANON.thigh, taper: THIGH, colour: trousers }))
  const knee = new THREE.Group()
  knee.name = side < 0 ? 'knee-left' : 'knee-right'
  knee.position.y = -CANON.thigh
  leg.add(knee)
  knee.add(segment(build, { key: 'shin', length: SHIN_LENGTH, taper: SHIN, colour: trousers }))
  const shoe = outlined({
    THREE,
    geometry: prisonFootGeometry(
      seen,
      THREE,
      geometry(THREE, 'shoe', () => shoeGeometry(THREE)),
    ),
    material: prisonFootMaterial(seen, materials.skin, materials.dark),
    ink: materials.ink,
  })
  shoe.position.set(0, -CANON.shin + SHOE_HEIGHT / 2, 0.05)
  knee.add(shoe)
  leg.scale.y = frame.limb
  leg.position.set(side * CANON.hipX, CANON.hipY * frame.neck, 0)
  return { leg, knee }
}

function buildHand(build: HumanLimbsBuild, side: number) {
  const { THREE, geometry, materials } = build
  // Shaped in the buffer rather than by scaling the mesh: what a hand holds is
  // hung on it as a child, and a scaled hand would stretch the book with it.
  const hand = new THREE.Mesh(
    geometry(THREE, 'hand', () => new THREE.SphereGeometry(0.058, 7, 5).scale(0.72, 1.3, 0.48)),
    materials.skin,
  )
  hand.name = side < 0 ? 'hand-left' : 'hand-right'
  hand.position.y = -CANON.forearm
  const thumb = new THREE.Mesh(
    geometry(THREE, 'thumb', () => new THREE.SphereGeometry(0.02, 5, 4).scale(0.9, 1.7, 0.9)),
    materials.skin,
  )
  thumb.position.set(0, 0.012, 0.03)
  thumb.rotation.x = 0.5
  hand.add(thumb)
  return hand
}

function buildArm(build: HumanLimbsBuild, side: number): { arm: Group; elbow: Group } {
  const { THREE, geometry, outlined, glow, profile, frame, materials } = build
  const arm = new THREE.Group()
  arm.name = side < 0 ? 'shoulder-left' : 'shoulder-right'
  const sleeve = profile.jacket
  arm.add(
    segment(build, { key: 'upper-arm', length: CANON.upperArm, taper: UPPER_ARM, colour: sleeve }),
  )
  const elbow = new THREE.Group()
  elbow.name = side < 0 ? 'elbow-left' : 'elbow-right'
  elbow.position.y = -CANON.upperArm
  arm.add(elbow)
  elbow.add(
    segment(build, { key: 'forearm', length: FOREARM_LENGTH, taper: FOREARM, colour: sleeve }),
  )
  elbow.add(buildHand(build, side))
  // The cap of the shoulder, which is what lets an arm leave the trunk rather
  // than hang beside it. Added after the elbow: the joint stays second.
  const cap = outlined({
    THREE,
    geometry: geometry(THREE, 'shoulder-cap', () => new THREE.SphereGeometry(0.078, 8, 6)),
    material: glow(sleeve, 1),
    ink: materials.ink,
  })
  cap.scale.y = 0.86
  cap.position.y = -0.012
  arm.add(cap)
  arm.scale.y = frame.limb
  arm.position.set(side * CANON.shoulderX * profile.shoulders, CANON.shoulderY * frame.neck, 0)
  arm.rotation.z = side * -0.07
  return { arm, elbow }
}

export function buildHumanLimbs(build: HumanLimbsBuild): HumanLimbs {
  const limbs: HumanLimbs = { arms: [], legs: [], elbows: [], knees: [] }
  for (const side of [-1, 1]) {
    const { leg, knee } = buildLeg(build, side)
    const { arm, elbow } = buildArm(build, side)
    build.figure.add(leg, arm)
    limbs.legs.push(leg)
    limbs.knees.push(knee)
    limbs.arms.push(arm)
    limbs.elbows.push(elbow)
  }
  return limbs
}

import { addBanquetSleeveBands } from './mangaTwinClothes'
import type { BufferGeometry, Group, Material, Mesh, MeshBasicMaterial } from 'three'
import type { HumanLook } from './humanFigure'
import type { FrameShape, HumanProfile } from './humanProfiles'
import { CANON } from './humanProportions'
import { shapeKurapikaLimbs } from './kurapikaSuit'
import { shapeMangaLimbs } from './mangaLimbClothes'
import { humanHandGeometry, addSleeveCuff, addShoeDetails } from './humanExtremityDetails'
import { prisonFootGeometry, prisonFootMaterial } from './humanPrisonProps'
import type { Geometry, Outlined, Three } from './silentMajorityParts'
import { hisokaClothGeometry, hisokaFabricMaterial, shadeHisokaFabric } from './hisokaFabric'
import { humanProportions } from './humanProfiles'

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
  /** Where the arm leaves the trunk: `HumanTrunk.shoulder`. */
  shoulder: number
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

/**
 * A build is a girth as well as a pair of shoulders: a slim body on the limbs
 * of an average one reads as a heavy body with a narrow chest.
 */
const GIRTH = { slim: 0.86, average: 1, broad: 1.12 } as const

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
  const { THREE, geometry, outlined, glow, profile, materials } = build
  const girth = GIRTH[profile.build]
  const tailored = profile.likeness === 'hisoka'
  const style = key === 'upper-arm' || key === 'forearm' ? 'shirt' : 'trousers'
  const fabric = glow(colour, 1)
  const limb = outlined({
    THREE,
    geometry: geometry(THREE, tailored ? `hisoka:${style}:${key}` : `limb:${key}`, () =>
      tailored
        ? hisokaClothGeometry(THREE, { length, taper, style })
        : taperedGeometry(THREE, length, taper),
    ),
    material: fabric,
    ink: materials.ink,
    scale: tailored ? 1.025 : 1.072,
  })
  if (tailored) (limb.children[1] as Mesh).material = hisokaFabricMaterial(THREE, fabric)
  limb.scale.set(girth, 1, girth)
  limb.position.y = -length / 2
  return limb
}

/** A rounded heel, instep and toe keep the shoe readable from front and profile. */
function shoeGeometry(THREE: Three): BufferGeometry {
  const stations = [
    { z: -0.105, width: 0.043, top: 0.04 },
    { z: -0.075, width: 0.052, top: 0.052 },
    { z: -0.025, width: 0.055, top: 0.054 },
    { z: 0.035, width: 0.059, top: 0.047 },
    { z: 0.095, width: 0.057, top: 0.034 },
    { z: 0.145, width: 0.046, top: 0.021 },
    { z: 0.168, width: 0.027, top: 0.014 },
  ] as const
  const bottom = -SHOE_HEIGHT / 2
  const vertices = stations.flatMap(({ z, width, top }) => [
    -width,
    bottom,
    z,
    width,
    bottom,
    z,
    -width,
    top,
    z,
    width,
    top,
    z,
  ])
  const indices: number[] = []
  for (let index = 0; index < stations.length - 1; index += 1)
    addShoeSection(indices, index * 4, (index + 1) * 4)
  indices.push(0, 2, 3, 0, 3, 1)
  const last = (stations.length - 1) * 4
  indices.push(last, last + 1, last + 3, last, last + 3, last + 2)
  const made = new THREE.BufferGeometry()
  made.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  made.setIndex(indices)
  made.computeVertexNormals()
  return made
}

function addShoeSection(indices: number[], current: number, next: number): void {
  indices.push(current, next + 1, next, current, current + 1, next + 1)
  indices.push(current + 2, next + 2, next + 3, current + 2, next + 3, current + 3)
  indices.push(current, next, next + 2, current, next + 2, current + 2)
  indices.push(current + 1, current + 3, next + 3, current + 1, next + 3, next + 1)
}

function buildLeg(build: HumanLimbsBuild, side: number): { leg: Group; knee: Group } {
  const { THREE, geometry, outlined, seen, profile, frame, materials } = build
  const leg = new THREE.Group()
  leg.name = side < 0 ? 'hip-left' : 'hip-right'
  const trousers = ['machi-komacine', 'nobunaga-hazama'].includes(profile.likeness ?? '')
    ? profile.skin
    : profile.trousers
  const legCloth = profile.likeness === 'bonolenov-ndongo' ? profile.jacket : trousers
  leg.add(
    segment(build, {
      key: 'thigh',
      length: CANON.thigh,
      taper: THIGH,
      colour: legCloth,
    }),
  )
  const knee = new THREE.Group()
  knee.name = side < 0 ? 'knee-left' : 'knee-right'
  knee.position.y = -CANON.thigh
  leg.add(knee)
  knee.add(
    segment(build, {
      key: 'shin',
      length: SHIN_LENGTH,
      taper: SHIN,
      colour: profile.clothing === 'ritual' ? profile.shirt : legCloth,
    }),
  )
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
  shoe.name = side < 0 ? 'foot-left' : 'foot-right'
  shoe.position.set(0, -CANON.shin + SHOE_HEIGHT / 2, 0.05)
  shoe.rotation.y = side * 0.035
  knee.add(shoe)
  addShoeDetails(build, shoe)
  leg.scale.y = frame.limb
  leg.position.set(side * CANON.hipX * humanProportions(profile).hips, CANON.hipY * frame.neck, 0)
  return { leg, knee }
}

function buildHand(build: HumanLimbsBuild, side: number) {
  const { THREE, geometry, materials } = build
  // Shaped in the buffer rather than by scaling the mesh: what a hand holds is
  // hung on it as a child, and a scaled hand would stretch the book with it.
  const hand = new THREE.Mesh(
    geometry(THREE, 'hand:articulated', () => humanHandGeometry(build)),
    materials.skin,
  )
  hand.name = side < 0 ? 'hand-left' : 'hand-right'
  hand.position.y = -CANON.forearm
  const thumb = new THREE.Mesh(
    geometry(THREE, 'thumb', () => new THREE.SphereGeometry(0.02, 5, 4).scale(0.9, 1.7, 0.9)),
    materials.skin,
  )
  thumb.name = side < 0 ? 'thumb-left' : 'thumb-right'
  thumb.position.set(side * 0.037, -0.002, 0.018)
  thumb.rotation.set(0.62, 0, side * -0.48)
  hand.add(thumb)
  return hand
}

function sleeveColour(profile: HumanProfile): number {
  if (profile.likeness === 'illumi') return profile.skin
  if (profile.likeness === 'hisoka') return profile.shirt
  if (profile.likeness === 'prince-fugetsu' && !profile.royalCostume) return profile.shirt
  if (profile.likeness === 'prince-kacho' && !profile.royalCostume) return profile.skin
  return profile.jacket
}

function forearmColour(profile: HumanProfile, sleeve: number): number {
  if (profile.likeness === 'beyond-netero' || profile.royalCostume === 'twins-banquet')
    return profile.skin
  return sleeve
}

function buildArm(build: HumanLimbsBuild, side: number): { arm: Group; elbow: Group } {
  const { THREE, geometry, outlined, glow, profile, frame, materials } = build
  const arm = new THREE.Group()
  arm.name = side < 0 ? 'shoulder-left' : 'shoulder-right'
  const sleeve = sleeveColour(profile)
  arm.add(
    segment(build, { key: 'upper-arm', length: CANON.upperArm, taper: UPPER_ARM, colour: sleeve }),
  )
  const elbow = new THREE.Group()
  elbow.name = side < 0 ? 'elbow-left' : 'elbow-right'
  elbow.position.y = -CANON.upperArm
  arm.add(elbow)
  elbow.add(
    segment(build, {
      key: 'forearm',
      length: FOREARM_LENGTH,
      taper: FOREARM,
      colour: forearmColour(profile, sleeve),
    }),
  )
  elbow.add(buildHand(build, side))
  addSleeveCuff(build, elbow)
  // The cap of the shoulder, which is what lets an arm leave the trunk rather
  // than hang beside it. Added after the elbow: the joint stays second.
  const tailored = profile.likeness === 'hisoka'
  const sleeveFabric = glow(sleeve, 1)
  const cap = outlined({
    THREE,
    geometry: geometry(THREE, tailored ? 'hisoka:shoulder-cap' : 'shoulder-cap', () =>
      tailored
        ? shadeHisokaFabric(THREE, new THREE.SphereGeometry(0.072, 22, 14))
        : new THREE.SphereGeometry(0.078, 8, 6),
    ),
    material: sleeveFabric,
    ink: materials.ink,
    ...(tailored ? { scale: 1.023 } : {}),
  })
  if (tailored) (cap.children[1] as Mesh).material = hisokaFabricMaterial(THREE, sleeveFabric)
  const girth = GIRTH[profile.build]
  cap.scale.set(girth, 0.86, girth)
  cap.position.y = -0.012
  arm.add(cap)
  if (profile.royalCostume === 'twins-banquet') addBanquetSleeveBands(build, arm)
  if (tailored) {
    const suffix = side < 0 ? 'left' : 'right'
    const shoulderSeam = new THREE.Mesh(
      geometry(THREE, 'hisoka:sleeve-head-seam', () =>
        new THREE.TorusGeometry(0.06, 0.0018, 5, 28).rotateX(Math.PI / 2),
      ),
      glow(0xb5a7a5, 1),
    )
    shoulderSeam.name = `hisoka-shoulder-panel-${suffix}`
    shoulderSeam.position.y = -0.062
    arm.add(shoulderSeam)
    const cuff = elbow.getObjectByName('sleeve-cuff')!
    const wrist = new THREE.Mesh(
      geometry(THREE, 'hisoka:cuff-seam', () =>
        new THREE.TorusGeometry(0.04, 0.0026, 5, 24).rotateX(Math.PI / 2),
      ),
      glow(0xb2a4a2, 1),
    )
    wrist.name = `hisoka-wrist-cuff-${suffix}`
    wrist.position.y = -0.237
    cuff.add(wrist)
  }
  arm.scale.y = frame.limb
  arm.position.set(side * build.shoulder * profile.shoulders, CANON.shoulderY * frame.neck, 0)
  arm.rotation.z = side * (-0.07 + humanProportions(profile).shoulderSlope)
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
  shapeKurapikaLimbs(build, limbs)
  shapeMangaLimbs(build, limbs)
  return limbs
}

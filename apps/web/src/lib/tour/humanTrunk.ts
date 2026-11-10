import type { BufferGeometry, Group, Material } from 'three'
import type { FrameShape, HumanProfile } from './humanProfiles'
import type { Geometry, Outlined, Three } from './silentMajorityParts'

/**
 * The trunk: a pelvis, a torso turned from a profile, a collar and a neck.
 *
 * The torso was a seven-sided tube, a fifth wider at the top than at the
 * bottom, and a tube is what it read as. What a panel draws is a wedge: the
 * shoulders are the widest line of the body, the waist is the narrowest, and
 * the top slopes into the neck instead of ending in a lid. A `build` used to
 * be one multiplier on that tube's width; it is a silhouette now — the slim
 * one barely flares, the broad one is a triangle standing on its point.
 */
export interface HumanTrunkBuild {
  THREE: Three
  geometry: Geometry
  outlined: Outlined
  figure: Group
  profile: HumanProfile
  frame: FrameShape
  materials: { cloth: Material; ink: Material; skin: Material; shirt: Material }
}

export interface HumanTrunk {
  pelvis: Group
  torso: Group
  /** The pelvis and belt multiplier: the build's width times the frame's. */
  width: number
}

/** Radius by height, belt to the root of the neck, about the torso's centre. */
type Profile = ReadonlyArray<readonly [radius: number, y: number]>

const TORSO: Record<HumanProfile['build'], Profile> = {
  slim: [
    [0.15, -0.3],
    [0.136, -0.14],
    [0.155, 0],
    [0.186, 0.13],
    [0.205, 0.22],
    [0.178, 0.275],
    [0.1, 0.315],
  ],
  average: [
    [0.165, -0.3],
    [0.152, -0.14],
    [0.175, 0],
    [0.212, 0.13],
    [0.232, 0.22],
    [0.2, 0.275],
    [0.11, 0.315],
  ],
  broad: [
    [0.185, -0.3],
    [0.178, -0.14],
    [0.205, 0],
    [0.245, 0.13],
    [0.262, 0.22],
    [0.225, 0.275],
    [0.12, 0.315],
  ],
}

/**
 * How far forward the chest comes, whatever the build.
 *
 * The shirt front, the lapels, the tie and the badge are flat marks laid a
 * little in front of this, at one depth for everybody. A broad chest that came
 * further forward than a slim one would swallow them.
 */
const CHEST_DEPTH = 0.158

const PELVIS_WIDTH = { slim: 0.92, average: 1, broad: 1.12 } as const

function torsoGeometry(THREE: Three, profile: Profile): BufferGeometry {
  // Bottom to top: that is the order that turns the faces outwards, which the
  // inverted hull of the contour depends on.
  const points = [new THREE.Vector2(0, profile[0][1])]
  for (const [radius, y] of profile) points.push(new THREE.Vector2(radius, y))
  points.push(new THREE.Vector2(0, profile[profile.length - 1][1] + 0.008))
  return new THREE.LatheGeometry(points, 10)
}

export function buildHumanTrunk(build: HumanTrunkBuild): HumanTrunk {
  const { THREE, geometry, outlined, figure, profile, frame, materials } = build
  const { cloth, ink, skin, shirt } = materials
  const width = PELVIS_WIDTH[profile.build] * frame.width

  const pelvis = outlined({
    THREE,
    geometry: geometry(THREE, 'pelvis', () => new THREE.SphereGeometry(0.2, 8, 6)),
    material: cloth,
    ink,
  })
  pelvis.scale.set(0.95 * width, 0.72, 0.74)
  pelvis.position.y = 0.76 * frame.neck
  figure.add(pelvis)

  const outline = TORSO[profile.build]
  const widest = Math.max(...outline.map(([radius]) => radius))
  const torso = outlined({
    THREE,
    geometry: geometry(THREE, `torso:${profile.build}`, () => torsoGeometry(THREE, outline)),
    material: cloth,
    ink,
  })
  torso.scale.set(profile.shoulders * frame.width, 1, CHEST_DEPTH / widest)
  torso.position.y = 1.12 * frame.neck
  figure.add(torso)

  const collar = new THREE.Mesh(
    geometry(THREE, 'collar', () => new THREE.CylinderGeometry(0.098, 0.128, 0.1, 7)),
    shirt,
  )
  collar.position.y = 1.43 * frame.neck
  figure.add(collar)

  // Long enough to reach a head that now sits clear of the collar.
  const neck = new THREE.Mesh(
    geometry(THREE, 'neck', () => new THREE.CylinderGeometry(0.058, 0.074, 0.2, 7)),
    skin,
  )
  neck.position.y = 1.51 * frame.neck
  figure.add(neck)

  return { pelvis, torso, width }
}

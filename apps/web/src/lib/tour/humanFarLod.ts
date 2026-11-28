import type { BufferGeometry, Group, Material } from 'three'
import type { FrameShape, HairStyle, HumanProfile } from './humanProfiles'
import { CANON } from './humanProportions'
import { mergeHumanDetails } from './humanDetailGeometry'

type Three = typeof import('three')
type GeometryCache = (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry

interface FarLodOptions {
  THREE: Three
  geometry: GeometryCache
  profile: HumanProfile
  frame: FrameShape
  unit: number
  materials: { cloth: Material; skin: Material; hair: Material }
}

const BUILD_WIDTH = { slim: 0.88, average: 1, broad: 1.18 } as const

/** Three cached masses that retain authored build, attire and hairstyle at walking distance. */
export function buildHumanFarLod(options: FarLodOptions): Group {
  const { THREE, geometry, profile, frame, unit, materials } = options
  const far = new THREE.Group()
  const width = BUILD_WIDTH[profile.build] * profile.shoulders
  const hem = ['gown', 'kakin-robe', 'kimono'].includes(profile.clothing) ? 0.23 : 0.12
  const body = new THREE.Mesh(
    geometry(
      THREE,
      `far:body:${profile.build}:${profile.clothing}:${profile.shoulders}`,
      () => new THREE.CylinderGeometry(0.19 * width, hem * width, 1.5, 5),
    ),
    materials.cloth,
  )
  body.position.y = 0.6
  const head = new THREE.Mesh(
    geometry(THREE, `far:head:${profile.face}:${profile.frame}`, () => {
      const shape = new THREE.SphereGeometry(0.13, 6, 4)
      if (profile.face === 'narrow') shape.scale(0.88, 1.08, 0.94)
      if (profile.face === 'square') shape.scale(1.08, 0.94, 1)
      return shape
    }),
    materials.skin,
  )
  head.position.y = CANON.headY * frame.neck
  const hair = new THREE.Mesh(
    geometry(THREE, `far:hair:${profile.hairStyle}`, () => farHair(THREE, profile.hairStyle)),
    materials.hair,
  )
  hair.position.y = (CANON.headY + 0.015) * frame.neck
  far.add(body, head, hair)
  far.scale.setScalar(unit)
  return far
}

type HairBuilder = (THREE: Three, crown: BufferGeometry) => BufferGeometry

const crown: HairBuilder = (_THREE, shape) => shape
const shaved: HairBuilder = (_THREE, shape) => shape.scale(0.94, 0.68, 0.94)
const bald: HairBuilder = (_THREE, shape) => shape.scale(1.02, 0.48, 1)
const afro: HairBuilder = (_THREE, shape) => shape.scale(1.65, 1.55, 1.55)
const curly: HairBuilder = (_THREE, shape) => shape.scale(1.38, 1.3, 1.3)
const peak =
  (radius: number, x = 0): HairBuilder =>
  (THREE, shape) =>
    mergeHumanDetails([shape, new THREE.ConeGeometry(radius, 0.28, 6).translate(x, 0.12, 0)])
const tail =
  (x: number, y: number, stretch = 1): HairBuilder =>
  (THREE, shape) =>
    mergeHumanDetails([
      shape,
      new THREE.SphereGeometry(0.075, 5, 4).scale(0.72, stretch, 0.72).translate(x, y, -0.1),
    ])
const fall =
  (width = 1, height = 0.5): HairBuilder =>
  (THREE, shape) =>
    mergeHumanDetails([
      shape,
      new THREE.CylinderGeometry(0.13, 0.105, height, 6)
        .scale(width, 1, 0.85)
        .translate(0, -0.18, -0.015),
    ])

const HAIR_BUILDERS: Record<HairStyle, HairBuilder> = {
  short: crown,
  military: crown,
  swept: crown,
  bob: crown,
  bowl: crown,
  'slicked-back': crown,
  curtain: crown,
  shaved,
  'bald-crown': bald,
  afro,
  curly,
  spiked: peak(0.135),
  wild: peak(0.17),
  pompadour: peak(0.135, 0.07),
  bun: tail(0.07, 0.09),
  chonmage: tail(0.07, 0.09),
  ponytail: tail(0, -0.09, 1.8),
  long: fall(),
  hime: fall(),
  drills: fall(1.25, 0.42),
}

function farHair(THREE: Three, style: HairStyle): BufferGeometry {
  return HAIR_BUILDERS[style](THREE, new THREE.SphereGeometry(0.136, 6, 3, 0, Math.PI * 2, 0, 1.2))
}

import type { BufferGeometry, Group, Material, MeshBasicMaterial, Object3D } from 'three'
import { createNenTechniqueState, isAuraVisibleTo, transitionNen } from '@black-whale/nen-engine'
import type { Apparition } from './apparitions'
import { humanAnimation, poseHuman } from './humanAnimation'
import { addCourtGown, addMorenaDetails, addSilentMajorityCostume } from './humanCostume'
import { frameShape, hasLikeness, humanProfile, isMorena } from './humanProfiles'
import { buildHumanHead } from './humanHead'
import { addHumanSignatures } from './humanSignature'
import { buildHumanAura, nenState, type Glass } from './humanAura'
import { animateHumanAura } from './humanAuraAnimation'

type Three = typeof import('three')
export type HumanLook = Apparition & { kind: 'avatar' | 'combatant' }

export interface HumanFigureBuild {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  /** The refractive shell an aura wears. Absent on the `low` palier. */
  glass?: Glass
  seen: HumanLook
  observerGyo?: boolean
}

export interface HumanFigure {
  root: Group
  turns: Object3D
  lod: { near: Group; far: Group }
  animate: (seconds: number) => void
}

export const HUMAN_INSTANCE_THRESHOLD = 20
export const HUMAN_LOD_DISTANCE = 24

/**
 * Geometry-affecting state only; combat motion must not rebuild a full rig.
 *
 * The likeness rides along explicitly rather than implicitly — ADR-005 §4-P1.
 * `identity` was already in both branches, so a declared face was already
 * keyed correctly by accident; naming it makes the dependency legible, and
 * makes the fact that a likeness changes the *rig* — a gabarit, a hairstyle
 * built from cones, signature pieces hung on the skeleton — rather than only a
 * colour, something a later edit cannot quietly forget.
 */
export function humanStateKey(seen: Apparition): string {
  if (!seen.human) return String(seen.stage)
  const likeness = hasLikeness(seen.human.identity)
  if (seen.kind !== 'combatant') return JSON.stringify({ ...seen.human, likeness })
  return JSON.stringify({
    role: seen.human.role,
    identity: seen.human.identity,
    aura: seen.human.aura,
    likeness,
  })
}

const SKIN = 0xd8b49a
const INK = 0x171318
const SHIRT = 0xe7e1d4
const BOOTS = 0x17191d

const geometryCaches = new WeakMap<Three, Map<string, BufferGeometry>>()
const outlineMaterials = new WeakMap<MeshBasicMaterial, MeshBasicMaterial>()

function geometry(THREE: Three, key: string, make: () => BufferGeometry): BufferGeometry {
  let cache = geometryCaches.get(THREE)
  if (!cache) {
    cache = new Map()
    geometryCaches.set(THREE, cache)
  }
  const held = cache.get(key)
  if (held) return held
  const made = make()
  made.userData.sharedHuman = true
  cache.set(key, made)
  return made
}

function outlineMaterial(THREE: Three, source: MeshBasicMaterial): MeshBasicMaterial {
  const held = outlineMaterials.get(source)
  if (held) return held
  const made = source.clone()
  made.side = THREE.BackSide
  outlineMaterials.set(source, made)
  return made
}

/**
 * The second tone, baked per vertex — ADR-005 §4-P4.
 *
 * A manga panel has two values and a hard edge between them, not a gradient:
 * the flat, and the shade under it. The walk had the flat and one plane of ink
 * under the jaw, which reads as a sticker rather than as a lit body. This puts
 * the second value where a bake belongs — in the geometry — by writing a colour
 * attribute on the shared buffer: the lower half of every mass is the shade,
 * the upper half is the flat, and the boundary is abrupt because that is the
 * whole point.
 *
 * Written onto the cached geometry, so it is paid once for the whole ship
 * rather than once per body, and it is idempotent: a buffer that already
 * carries the attribute is handed straight back.
 */
const SHADE = 0.76

function shaded(THREE: Three, source: BufferGeometry): BufferGeometry {
  if (source.getAttribute('color')) return source
  const position = source.getAttribute('position')
  source.computeBoundingBox()
  const box = source.boundingBox
  if (!box) return source
  const span = Math.max(box.max.y - box.min.y, 1e-6)
  const tones = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i += 1) {
    const tone = (position.getY(i) - box.min.y) / span > 0.46 ? 1 : SHADE
    tones[i * 3] = tone
    tones[i * 3 + 1] = tone
    tones[i * 3 + 2] = tone
  }
  source.setAttribute('color', new THREE.BufferAttribute(tones, 3))
  return source
}

/**
 * The same flat colour, told to read the tone off the vertices.
 *
 * Keyed on the shared material rather than cloned per body: `glow` hands out
 * one material per colour for the whole scene, so this adds one more per
 * colour and not one per passenger. §5 keeps `renderer.info` as the rule.
 */
const tonedMaterials = new WeakMap<Material, Material>()

function toned(source: Material): Material {
  const held = tonedMaterials.get(source)
  if (held) return held
  const made = (source as MeshBasicMaterial).clone()
  made.vertexColors = true
  tonedMaterials.set(source, made)
  return made
}

interface OutlinedShape {
  THREE: Three
  geometry: BufferGeometry
  material: Material
  ink: Material
  scale?: number
}

/**
 * A mass and its ink.
 *
 * The default thickened from 1,045 to 1,062 in ADR-005 §4-P4: the walk draws
 * these at conversational range far more often than it did when the only
 * bodies aboard were supplied by a game, and a hairline contour at two metres
 * is a contour that has stopped being ink. The far LOD does not go through
 * here, so nothing at twenty-four metres gets a heavier line.
 */
function outlined({ THREE, geometry, material, ink, scale = 1.062 }: OutlinedShape): Group {
  const group = new THREE.Group()
  const edge = new THREE.Mesh(geometry, outlineMaterial(THREE, ink as MeshBasicMaterial))
  edge.scale.setScalar(scale)
  group.add(edge, new THREE.Mesh(shaded(THREE, geometry), toned(material)))
  return group
}

interface LimbShape extends HumanFigureBuild {
  radius: number
  length: number
  colour: number
}

function limb({ THREE, glow, radius, length, colour }: LimbShape): Group {
  return outlined({
    THREE,
    geometry: geometry(
      THREE,
      `limb:${radius}:${length}`,
      () => new THREE.CapsuleGeometry(radius, length, 3, 7),
    ),
    material: glow(colour, 1),
    ink: glow(INK, 1),
    scale: 1.072,
  })
}

function legacyPose(seen: HumanLook): NonNullable<Apparition['human']>['pose'] {
  if (seen.human) return seen.human.pose
  const pose = Math.floor(seen.stage / 3)
  return pose === 1
    ? 'guard'
    : pose === 2
      ? 'held'
      : pose === 3
        ? 'fallen'
        : pose === 4
          ? 'attack'
          : 'idle'
}

export function buildHumanFigure({
  THREE,
  glow,
  glass,
  seen,
  observerGyo = false,
}: HumanFigureBuild): HumanFigure {
  const root = new THREE.Group()
  const figure = new THREE.Group()
  const far = new THREE.Group()
  const profile = humanProfile(seen)
  const unit = (seen.kind === 'avatar' ? seen.size / 0.42 : seen.size) * profile.height
  figure.scale.setScalar(unit)
  root.add(figure)
  root.add(far)
  far.visible = false

  const ink = glow(INK, 1)
  const cloth = glow(profile.jacket, 0.98)
  const skin = glow(profile.skin || SKIN, 1)
  const dark = glow(BOOTS, 1)
  const hairInk = glow(profile.hair, 1)
  const accent = glow(profile.accent, 1)
  const pose = legacyPose(seen)
  // A child is not a small man and a baby is not a small child — ADR-005 §4-P2.
  const frame = frameShape(profile.frame)
  const arms: Group[] = []
  const legs: Group[] = []

  const pelvis = outlined({
    THREE,
    geometry: geometry(THREE, 'pelvis', () => new THREE.SphereGeometry(0.2, 8, 6)),
    material: cloth,
    ink,
  })
  const buildWidth =
    (profile.build === 'slim' ? 0.92 : profile.build === 'broad' ? 1.12 : 1) * frame.width
  pelvis.scale.set(1.08 * buildWidth, 0.7, 0.76)
  pelvis.position.y = 0.76 * frame.neck
  figure.add(pelvis)

  const torso = outlined({
    THREE,
    geometry: geometry(THREE, 'torso', () => new THREE.CylinderGeometry(0.22, 0.18, 0.58, 7)),
    material: cloth,
    ink,
  })
  torso.scale.set(profile.shoulders * buildWidth, 1, 0.72)
  torso.position.y = 1.12 * frame.neck
  figure.add(torso)

  const collar = new THREE.Mesh(
    geometry(THREE, 'collar', () => new THREE.CylinderGeometry(0.13, 0.17, 0.1, 7)),
    glow(profile.shirt || SHIRT, 1),
  )
  collar.position.y = 1.43 * frame.neck
  figure.add(collar)

  const neck = new THREE.Mesh(
    geometry(THREE, 'neck', () => new THREE.CylinderGeometry(0.075, 0.09, 0.14, 7)),
    skin,
  )
  neck.position.y = 1.51 * frame.neck
  figure.add(neck)

  const head = buildHumanHead({
    THREE,
    geometry,
    outlined,
    glow,
    profile,
    seen,
    materials: { ink, skin, hairInk },
  })
  head.scale.setScalar(frame.head)
  head.position.y *= frame.neck
  figure.add(head)

  const shirtFront = new THREE.Mesh(
    geometry(THREE, 'clothes:shirt', () => new THREE.PlaneGeometry(0.16, 0.28)),
    glow(profile.shirt, 1),
  )
  shirtFront.position.set(0, 1.19, 0.165)
  figure.add(shirtFront)
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(
      geometry(THREE, 'clothes:lapel', () => new THREE.PlaneGeometry(0.1, 0.3)),
      cloth,
    )
    lapel.position.set(side * 0.075, 1.23, 0.175)
    lapel.rotation.z = side * -0.28
    figure.add(lapel)
  }
  const belt = new THREE.Mesh(
    geometry(THREE, 'clothes:belt', () => new THREE.BoxGeometry(0.39, 0.045, 0.24)),
    dark,
  )
  belt.position.y = 0.82 * frame.neck
  belt.scale.x = buildWidth
  figure.add(belt)
  if (profile.clothing === 'suit') {
    const tie = new THREE.Mesh(
      geometry(THREE, 'clothes:tie', () => new THREE.ConeGeometry(0.035, 0.25, 3)),
      accent,
    )
    tie.position.set(0, 1.19, 0.184)
    tie.rotation.x = Math.PI
    figure.add(tie)
  }
  if (profile.clothing === 'uniform') {
    for (const side of [-1, 1]) {
      const epaulette = new THREE.Mesh(
        geometry(THREE, 'clothes:epaulette', () => new THREE.BoxGeometry(0.14, 0.035, 0.18)),
        accent,
      )
      epaulette.position.set(side * 0.25 * profile.shoulders, 1.4, 0)
      figure.add(epaulette)
    }
  }
  if (profile.clothing === 'uniform' || profile.clothing === 'suit') {
    const badge = new THREE.Mesh(
      geometry(THREE, 'clothes:badge', () => new THREE.CircleGeometry(0.035, 6)),
      accent,
    )
    badge.position.set(0.12, 1.29, 0.183)
    figure.add(badge)
  }
  if (profile.clothing === 'uniform') {
    const radio = new THREE.Mesh(
      geometry(THREE, 'accessory:radio', () => new THREE.BoxGeometry(0.065, 0.12, 0.035)),
      dark,
    )
    radio.position.set(-0.18, 1.31, 0.18)
    figure.add(radio)
  } else if (profile.clothing === 'combat') {
    const armband = new THREE.Mesh(
      geometry(THREE, 'accessory:armband', () => new THREE.CylinderGeometry(0.07, 0.07, 0.06, 7)),
      accent,
    )
    armband.position.set(-0.3 * profile.shoulders, 1.23, 0)
    figure.add(armband)
  }
  if (profile.clothing === 'ritual') {
    addSilentMajorityCostume({
      THREE,
      geometry,
      outlined,
      figure,
      cloth,
      ink,
      accent,
      dark,
      skin,
    })
  }
  if (profile.clothing === 'gown') {
    // Her marks belong to her. Anyone else the archive has actually drawn gets
    // the garment and not the person; anyone it has not drawn keeps exactly
    // what they had, which is ADR-005 §5's promise about diffs.
    const dressed = { THREE, geometry, outlined, figure, cloth, ink, accent, dark, skin }
    if (isMorena(profile) || !profile.likeness) {
      addMorenaDetails({ ...dressed, head, seated: pose === 'seated' })
    } else {
      addCourtGown(dressed)
    }
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    leg.name = side < 0 ? 'hip-left' : 'hip-right'
    const thigh = limb({ THREE, glow, seen, radius: 0.085, length: 0.25, colour: profile.trousers })
    thigh.position.y = -0.15
    leg.add(thigh)
    const knee = new THREE.Group()
    knee.name = side < 0 ? 'knee-left' : 'knee-right'
    knee.position.y = -0.31
    leg.add(knee)
    const shin = limb({ THREE, glow, seen, radius: 0.07, length: 0.24, colour: profile.trousers })
    shin.position.y = -0.14
    knee.add(shin)
    const shoe = outlined({
      THREE,
      geometry: geometry(THREE, 'shoe', () => new THREE.BoxGeometry(0.15, 0.09, 0.25)),
      material: dark,
      ink,
    })
    shoe.position.set(0, -0.32, 0.055)
    knee.add(shoe)
    leg.scale.y = frame.limb
    leg.position.set(side * 0.13, 0.77 * frame.neck, 0)
    figure.add(leg)
    legs.push(leg)

    const arm = new THREE.Group()
    arm.name = side < 0 ? 'shoulder-left' : 'shoulder-right'
    const upper = limb({ THREE, glow, seen, radius: 0.062, length: 0.2, colour: profile.jacket })
    upper.position.y = -0.13
    arm.add(upper)
    const elbow = new THREE.Group()
    elbow.name = side < 0 ? 'elbow-left' : 'elbow-right'
    elbow.position.y = -0.27
    arm.add(elbow)
    const forearm = limb({ THREE, glow, seen, radius: 0.052, length: 0.18, colour: profile.jacket })
    forearm.position.y = -0.11
    elbow.add(forearm)
    const hand = new THREE.Mesh(
      geometry(THREE, 'hand', () => new THREE.SphereGeometry(0.062, 7, 5)),
      skin,
    )
    hand.name = side < 0 ? 'hand-left' : 'hand-right'
    hand.position.y = -0.25
    elbow.add(hand)
    arm.scale.y = frame.limb
    arm.position.set(side * 0.3 * profile.shoulders, 1.34 * frame.neck, 0)
    arm.rotation.z = side * -0.1
    figure.add(arm)
    arms.push(arm)
  }

  const elbows = arms.map(
    (arm) => arm.children.find((child) => child.name.startsWith('elbow')) as Group,
  )
  const knees = legs.map(
    (leg) => leg.children.find((child) => child.name.startsWith('knee')) as Group,
  )

  poseHuman({ pose, figure, head, arms, legs, elbows, knees })

  // Annexe B, last, because §2.2 says so: the gabarit, the hair and the palette
  // have already named this person at walking distance, and a diadem or a pair
  // of round glasses is what closes it up close. Empty for everyone undeclared.
  addHumanSignatures({
    THREE,
    geometry,
    parts: { figure, head, rightHand: elbows[1].getObjectByName('hand-right') ?? elbows[1] },
    materials: { ink, skin, accent, cloth, dark },
    worn: { signatures: profile.signatures, attire: profile.clothing },
  })

  const groundShadow = new THREE.Mesh(
    geometry(THREE, 'ground-shadow', () => new THREE.CircleGeometry(0.42, 12)),
    glow(INK, 0.2),
  )
  groundShadow.rotation.x = -Math.PI / 2
  groundShadow.scale.y = 0.42
  groundShadow.position.y = 0.008
  root.add(groundShadow)

  if (seen.human?.alert) {
    const alert = new THREE.Mesh(
      geometry(THREE, 'alert-ring', () => new THREE.RingGeometry(0.43, 0.48, 20)),
      glow(0xb92d3a, 0.55),
    )
    alert.rotation.x = -Math.PI / 2
    alert.position.y = 0.012
    root.add(alert)
  }

  const nen = nenState(seen)
  const observer = observerGyo
    ? transitionNen(createNenTechniqueState(), { type: 'GYO', on: true }).state
    : createNenTechniqueState()
  const auraVisible = isAuraVisibleTo(nen, observer)
  const aura = buildHumanAura({
    THREE,
    geometry,
    glow,
    ...(glass ? { glass } : {}),
    seen,
    nen,
    auraVisible,
    figure,
    root,
  })

  // Three shapes past twenty-four metres, listed rather than spelled out: at
  // that distance a body is a mass, a face and a hair colour, and the loop is
  // the honest length of that statement.
  const FAR: ReadonlyArray<readonly [string, () => BufferGeometry, Material, number]> = [
    ['far:body', () => new THREE.CylinderGeometry(0.2, 0.14, 1.2, 5), cloth, 0.72],
    ['far:head', () => new THREE.SphereGeometry(0.18, 6, 4), skin, 1.52],
    ['far:hair', () => new THREE.SphereGeometry(0.185, 6, 3, 0, Math.PI * 2, 0, 1.2), hairInk, 1.54],
  ]
  for (const [key, make, material, y] of FAR) {
    const shape = new THREE.Mesh(geometry(THREE, key, make), material)
    shape.position.y = y * frame.neck
    far.add(shape)
  }
  far.scale.setScalar(unit)
  far.position.copy(figure.position)
  far.rotation.copy(figure.rotation)

  const animateHuman = humanAnimation({ pose, figure, torso, pelvis, head, arms, legs, knees })
  const animateAura = animateHumanAura(aura, nen)
  const animate = (seconds: number) => {
    animateHuman(seconds)
    animateAura(seconds)
  }

  return { root, turns: figure, lod: { near: figure, far }, animate }
}

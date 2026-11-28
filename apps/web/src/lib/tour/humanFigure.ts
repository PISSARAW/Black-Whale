import { twinWardrobe } from './mangaTwinWardrobe'
import type { BufferGeometry, Group, Material, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'
import { humanAnimation, poseHuman, type HumanJointSlots } from './humanAnimation'
import { legacyHumanPose as legacyPose } from './humanRestPoses'
import { addPrisonBook } from './humanPrisonProps'
import { addMorenaDetails, addSilentMajorityCostume } from './humanCostume'
import { SILENT_MAJORITY_PALETTE } from './silentMajorityPalette'
import { addMorenaSkirt } from './mangaMorenaClothes'
import {
  hasLikeness,
  humanProfile,
  isMorena,
  profileFrameShape,
  type HumanProfile,
} from './humanProfiles'
import { finishHumanModel } from './humanModelFinish'
import { buildHumanHead } from './humanHead'
import { buildHumanLimbs } from './humanLimbs'
import { applyHumanPosture, CANON, stance } from './humanProportions'
import { buildHumanTrunk } from './humanTrunk'
import { addHumanClothes } from './humanClothes'
import { contactShadow } from './contactShadow'
import { addHumanSignatures } from './humanSignature'
import { buildHumanAura, nenState, type Glass } from './humanAura'
import { animateHumanAura } from './humanAuraAnimation'
import { auraLayersFor, type AuraSight } from './auraSight'
import { firstPersonArms } from './humanFirstPerson'
import { humanSecondaryMotionChannels } from './humanSecondaryMotion'
import { humanFaceMotion } from './humanFaceMotion'
import { humanExpressionChannel } from './expressions/humanExpressionChannel'
import { registerExpressionOwner } from './expressions/expressionPlayer'
import { buildHumanFarLod } from './humanFarLod'
import { ensureHumanExtremityAnchors } from './humanExtremityAnchors'
import { addHumanHandRigs } from './humanHandRig'
import { addHumanFootRigs } from './humanFootRig'
import {
  addWobleSwaddle,
  finishSwaddledWoble,
  WOBLE_HELD_SCALE,
  wobleSwaddleProfile,
} from './wobleSwaddle'
import { poseSilentMajority } from './silentMajorityPose'
type Three = typeof import('three')
export type HumanLook = Apparition & { kind: 'avatar' | 'combatant' }
export interface HumanFigureBuild {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  /** The refractive shell an aura wears. Absent on the `low` palier. */
  glass?: Glass
  seen: HumanLook
  /** Explicit body variant supplied by a game; the visit keeps its catalogue profile. */
  profile?: HumanProfile
  /** What the visitor can see of aura. Absent is plain sight. See `auraSight.ts`. */
  observerSight?: AuraSight
  /** Fighting uses the visitor's Ren/On envelope; ship figures keep their skin. */
  auraStyle?: 'human' | 'visitor'
}
export interface HumanFigure {
  root: Group
  turns: Object3D
  lod: { near: Group; far: Group }
  joints: HumanJointSlots
  animate: ReturnType<typeof humanAnimation>
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
    expression: seen.human.expression,
    firstPerson: seen.human.firstPerson,
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

export function buildHumanFigure({
  THREE,
  glow,
  glass,
  seen,
  profile: suppliedProfile,
  observerSight = 'sight',
  auraStyle = 'human',
}: HumanFigureBuild): HumanFigure {
  const pose = legacyPose(seen)
  const declared = suppliedProfile ?? humanProfile(seen)
  const swaddled = wobleSwaddleProfile(declared, pose, seen)
  const baseProfile = twinWardrobe(swaddled ?? declared, seen.human)
  const profile = seen.human?.expression
    ? { ...baseProfile, expression: seen.human.expression }
    : baseProfile
  const root = new THREE.Group()
  const figure = new THREE.Group()
  // A child is not a small man and a baby is not a small child — ADR-005 §4-P2.
  const frame = profileFrameShape(profile)
  const { lift, stature } = stance(frame)
  const size = seen.kind === 'avatar' ? seen.size / 0.42 : seen.size
  const unit = size * profile.height * stature * (swaddled ? WOBLE_HELD_SCALE : 1)
  figure.scale.setScalar(unit)
  const far = buildHumanFarLod({
    THREE,
    geometry,
    profile,
    frame,
    unit,
    materials: {
      cloth: glow(profile.jacket, 1),
      skin: glow(profile.skin || SKIN, 1),
      hair: glow(profile.hair, 1),
    },
  })
  root.add(figure)
  root.add(far)
  far.visible = false

  const ink = glow(INK, 1)
  // Clothing is solid. At 0.98 it entered three.js's transparent sort, where a
  // later Zetsu trace could win the draw order and erase sleeves at some angles.
  const cloth = glow(profile.jacket, 1)
  const skin = glow(profile.skin || SKIN, 1)
  const dark = glow(BOOTS, 1)
  const hairInk = glow(profile.hair, 1)
  const accent = glow(profile.accent, 1)
  const { pelvis, torso, width, shoulder } = buildHumanTrunk({
    THREE,
    geometry,
    outlined,
    figure,
    profile,
    frame,
    materials: {
      cloth,
      ink,
      skin,
      shirt: glow(profile.shirt || SHIRT, 1),
      trousers: glow(profile.trousers, 1),
    },
  })

  const head = buildHumanHead({
    THREE,
    geometry,
    outlined,
    glow,
    profile,
    seen,
    materials: { ink, skin, hairInk },
  })
  const marionette = seen.human?.role === 'silent-majority'
  head.scale.setScalar(frame.head * CANON.headScale)
  if (profile.likeness === 'kurapika') head.scale.x *= 1.12
  if (profile.likeness === 'melody') head.scale.multiplyScalar(1.2)
  head.position.y *= frame.neck
  if (marionette) {
    head.scale.multiplyScalar(0.8)
    head.position.y -= 0.032
  }
  head.visible = !seen.human?.firstPerson
  figure.add(head)

  addHumanClothes({
    THREE,
    geometry,
    figure,
    profile,
    frame,
    width,
    shoulder,
    materials: { cloth, shirt: glow(profile.shirt, 1), dark, accent, ink, skin },
  })
  if (profile.clothing === 'gown' && !profile.likeness) {
    // Her marks belong to her. Anyone else the archive has actually drawn gets
    // the garment and not the person; anyone it has not drawn keeps exactly
    // what they had, which is ADR-005 §5's promise about diffs.
    const dressed = {
      THREE,
      geometry,
      outlined,
      figure,
      cloth,
      ink,
      accent,
      dark,
      skin,
      hair: hairInk,
    }
    addMorenaDetails({ ...dressed, head, seated: pose === 'seated' })
  }
  if (isMorena(profile))
    addMorenaSkirt({ THREE, geometry, outlined, figure, cloth, ink, seated: pose === 'seated' })

  const { arms, legs, elbows, knees } = buildHumanLimbs({
    THREE,
    geometry,
    outlined,
    glow,
    figure,
    seen,
    profile,
    frame,
    shoulder,
    materials: { ink, skin, dark },
  })
  const joints: HumanJointSlots = {
    elbows,
    hands: elbows.map(
      (elbow, index) => elbow.getObjectByName(index === 0 ? 'hand-left' : 'hand-right') ?? elbow,
    ),
    knees,
    feet: knees
      .map(
        (knee, index) =>
          knee.getObjectByName(index === 0 ? 'foot-left' : 'foot-right') ?? knee.children[1],
      )
      .filter(Boolean),
  }
  if (profile.clothing === 'ritual') {
    const sash = glow(SILENT_MAJORITY_PALETTE.sash, 1)
    const brass = glow(SILENT_MAJORITY_PALETTE.brass, 1)
    addSilentMajorityCostume({
      THREE,
      geometry,
      outlined,
      figure,
      arms,
      knees,
      ink,
      accent,
      dark,
      cloth,
      sash,
      brass,
    })
  }

  // Standing bodies are raised by what their legs gained; a pose that puts the
  // body somewhere else — a chair, a cushion, the floor — says so itself.
  figure.position.y = lift * unit
  poseHuman({ pose, figure, head, arms, legs, elbows, knees })
  applyHumanPosture({ figure, head, posture: profile.proportions?.posture })
  if (marionette && pose === 'idle') poseSilentMajority({ head, arms, legs }, 0)

  // Annexe B, last, because §2.2 says so: the gabarit, the hair and the palette
  // have already named this person at walking distance, and a diadem or a pair
  // of round glasses is what closes it up close. Empty for everyone undeclared.
  addHumanSignatures({
    THREE,
    geometry,
    parts: {
      figure,
      head,
      arms,
      rightHand: joints.hands[1],
    },
    materials: { ink, skin, accent, cloth, dark },
    worn: {
      signatures: profile.signatures,
      attire: profile.clothing,
      manga: Boolean(profile.likeness) && !isMorena(profile),
    },
  })

  addPrisonBook({ THREE, seen, figure, paper: cloth, cover: cloth })

  // Scaled by the body rather than fixed: a child took the same coin-sized
  // patch as a guardsman before. See `$lib/tour/contactShadow`.
  root.add(contactShadow(THREE, { radius: 0.46 * unit, squash: 0.45 }))

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
  const layers = auraLayersFor(nen, observerSight)
  const aura = buildHumanAura({
    THREE,
    auraStyle,
    geometry,
    glow,
    ...(glass ? { glass } : {}),
    seen,
    nen,
    auraVisible: layers.light,
    auraFelt: layers.felt,
    observerGyo: layers.gyo,
    figure,
    root,
  })

  far.position.copy(figure.position)
  far.rotation.copy(figure.rotation)
  const poseSwaddle = swaddled
    ? addWobleSwaddle({ THREE, geometry, figure, far, head, limbs: [...arms, ...legs] })
    : undefined
  const animationRig = {
    pose,
    figure,
    torso,
    pelvis,
    head,
    arms,
    legs,
    knees,
    joints,
  }
  registerExpressionOwner(root, figure)
  const animateHuman = humanAnimation(animationRig, {
    channels: [
      ...(seen.kind === 'combatant' ? [] : [humanFaceMotion(head, profile)]),
      ...humanSecondaryMotionChannels(animationRig, profile),
      ...(seen.kind === 'combatant'
        ? []
        : [humanExpressionChannel({ THREE, rig: animationRig, profile })]),
    ],
  })
  const animateAura = animateHumanAura(aura)
  const firstPerson = seen.human?.firstPerson === true
  const animate: ReturnType<typeof humanAnimation> = (seconds, nextPose, layer) => {
    animateHuman(seconds, nextPose, layer)
    if (marionette && (nextPose ?? pose) === 'idle' && !layer?.motion)
      poseSilentMajority({ head, arms, legs }, seconds)
    poseSwaddle?.((nextPose ?? pose) === 'held')
    if (firstPerson) firstPersonArms({ root, arms }, nextPose ?? pose)
    animateAura(seconds)
  }
  finishHumanModel({ THREE, glow, model: { root }, profile })
  ensureHumanExtremityAnchors(root)
  addHumanHandRigs({ THREE, root, profile })
  addHumanFootRigs({ THREE, root, profile })
  if (pose === 'zetsu') {
    for (const name of ['face-eye-left', 'face-eye-right']) {
      const eye = root.getObjectByName(name)
      if (eye) eye.scale.y = 0.06
    }
  }
  const model = { root, turns: figure, lod: { near: figure, far }, joints, animate }
  if (swaddled) finishSwaddledWoble(model, profile)
  return model
}

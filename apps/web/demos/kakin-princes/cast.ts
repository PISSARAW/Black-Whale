import * as THREE from 'three'
import type { Apparition } from '../../src/lib/tour/apparitions'
import { buildHumanFigure, type HumanLook } from '../../src/lib/tour/humanFigure'
import { humanProfile, type HumanProfile } from '../../src/lib/tour/humanProfiles'
import { buildUncoveredTserriednich } from '../../src/lib/fighting/victory/tserriednichLikeness'
import { improveFightFace } from '../../src/lib/fighting/fightFaceReadability'
import { improveFightBodyReadability } from '../../src/lib/fighting/fightBodyReadability'
import { addFightRosterFinish } from '../../src/lib/fighting/fightRosterFinish'
import { CANON } from '../../src/lib/tour/humanProportions'
import { buildEmbellishmentApparition } from '../../src/lib/tour/apparitionEmbellishmentView'
import { humanAnimationRig, type HumanMotion } from '../../src/lib/tour/humanAnimation'
import { buildGuardianApparition } from '../../src/lib/tour/apparitionGuardianView'
import { buildRoyalBeastApparition } from '../../src/lib/tour/apparitionRoyalBeastView'
import { buildMechanicalApparition } from '../../src/lib/tour/apparitionMechanicalView'
import { buildCrawlingApparition } from '../../src/lib/tour/apparitionCrawlingView'
import { buildSpriteApparition } from '../../src/lib/tour/apparitionSpriteView'
import { buildDragonApparition } from '../../src/lib/tour/apparitionDragonView'
import { buildWormPortal } from '../../src/lib/tour/apparitionPortalView'
import type { Actor, Guardian } from './shots'

const materials = new Map<string, THREE.MeshBasicMaterial>()
function glow(color: number, opacity: number) {
  const key = `${color}:${opacity}`
  const existing = materials.get(key)
  if (existing) return existing
  const material = new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: opacity < 1,
    depthWrite: opacity >= 0.8,
  })
  materials.set(key, material)
  return material
}

function goblet() {
  const points = [
    [0, 0],
    [0.055, 0],
    [0.055, 0.008],
    [0.016, 0.015],
    [0.012, 0.1],
    [0.047, 0.119],
    [0.068, 0.145],
    [0.07, 0.19],
    [0.063, 0.216],
    [0.057, 0.216],
    [0.062, 0.19],
    [0.06, 0.15],
    [0.04, 0.124],
    [0, 0.119],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(points, 24),
    new THREE.MeshPhongMaterial({
      color: 0xeaf2ea,
      transparent: true,
      opacity: 0.55,
      shininess: 110,
      side: THREE.DoubleSide,
    }),
  )
  const wine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.046, 24), glow(0x432027, 1))
  wine.position.y = 0.148
  glass.add(wine)
  return glass
}

type PoseRig = Parameters<HumanMotion>[0]

const SIDES = ['left', 'right'] as const

function joint(rig: PoseRig, part: 'elbow' | 'hand' | 'foot', index: number) {
  const name = `${part}-${SIDES[index]}`
  const node = rig.figure.getObjectByName(name)
  if (!node) throw new Error(`Missing film pose joint: ${name}`)
  return node
}

function reachHand(rig: PoseRig, index: number, wrist: THREE.Vector3) {
  const arm = rig.arms[index]
  const direction = wrist.clone().sub(arm.position)
  const upper = CANON.upperArm * arm.scale.y
  const lower = CANON.forearm * arm.scale.y
  const length = Math.min(direction.length(), upper + lower - 0.006)
  direction.normalize()
  const along = (upper ** 2 - lower ** 2 + length ** 2) / (2 * length)
  const bend = Math.sqrt(Math.max(0, upper ** 2 - along ** 2))
  const outward = new THREE.Vector3(index === 0 ? -1 : 1, -1, 0)
  outward.addScaledVector(direction, -outward.dot(direction)).normalize()
  const midpoint = arm.position
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(outward, bend)
  const down = new THREE.Vector3(0, -1, 0)
  const forearm = arm.position.clone().addScaledVector(direction, length).sub(midpoint).normalize()
  arm.quaternion.setFromUnitVectors(down, midpoint.clone().sub(arm.position).normalize())
  joint(rig, 'elbow', index).quaternion.setFromUnitVectors(
    down,
    forearm.applyQuaternion(arm.quaternion.clone().invert()),
  )
}

function cradle(rig: PoseRig) {
  reachHand(rig, 0, new THREE.Vector3(-0.26, 1.24, 0.29))
  reachHand(rig, 1, new THREE.Vector3(0.01, 1.09, 0.29))
  rig.head.rotation.x += 0.12
}

function handsOnThighs(rig: PoseRig, height: number) {
  rig.legs.forEach((hip, index) => {
    const at = hip
      .getWorldPosition(new THREE.Vector3())
      .lerp(rig.knees[index].getWorldPosition(new THREE.Vector3()), index === 0 ? 0.66 : 0.54)
    const palm = rig.figure.worldToLocal(at)
    palm.y += height
    reachHand(rig, index, palm)
  })
}

function poseLuzurus(rig: PoseRig) {
  rig.figure.rotation.x = -0.24
  rig.head.rotation.x = 0.15
  rig.legs[0].rotation.set(-1.32, 0, -0.29)
  rig.legs[1].rotation.set(-1.43, 0, 0.36)
  rig.knees[0].rotation.set(0.37, 0, 0)
  rig.knees[1].rotation.set(0.58, 0, 0)
  handsOnThighs(rig, 0.102)
}

function poseSalesale(rig: PoseRig) {
  rig.figure.rotation.x = -0.12
  rig.head.rotation.x = 0.09
  rig.legs[0].rotation.set(-1.46, 0, -0.29)
  rig.legs[1].rotation.set(-1.39, 0, 0.34)
  rig.knees[0].rotation.set(0.22, 0, 0)
  rig.knees[1].rotation.set(0.32, 0, 0)
  reachHand(rig, 0, new THREE.Vector3(-0.44, 0.91, 0.22))
  reachHand(rig, 1, new THREE.Vector3(0.45, 0.88, 0.2))
}

function poseMarayam(rig: PoseRig) {
  rig.legs[0].rotation.set(-1.51, -0.12, -0.52)
  rig.legs[1].rotation.set(-1.49, 0.12, 0.52)
  rig.knees[0].rotation.set(0.38, 0.43, 0)
  rig.knees[1].rotation.set(0.38, -0.43, 0)
  handsOnThighs(rig, 0.09)
}

const onSupport = new Set<Actor['gesture']>(['floor-lounge', 'bed-lounge', 'play'])

function shoeContact(rig: Parameters<HumanMotion>[0]): number {
  const feet = SIDES.map((_, index) => joint(rig, 'foot', index))
  // The shoe's sole spans the heel and toe along the foot's local Z axis.
  return Math.min(
    ...feet.flatMap((foot) =>
      [-0.075, 0.105].map((z) => foot.localToWorld(new THREE.Vector3(0, -0.045, z)).y),
    ),
  )
}

function gestureFor(gesture: Actor['gesture'], seconds: number): HumanMotion {
  return (rig) => {
    const wave = Math.sin(seconds * 2.2)
    switch (gesture) {
      case 'toast':
        rig.arms[0].rotation.set(-0.86 - wave * 0.085, -0.05, 0.24)
        rig.arms[1].rotation.set(-0.52, 0, -0.06)
        joint(rig, 'elbow', 1).rotation.x = -0.67
        joint(rig, 'elbow', 0).rotation.x = -1.52
        rig.head.rotation.y += 0.1
        break
      case 'floor-lounge':
        poseLuzurus(rig)
        break
      case 'bed-lounge':
        poseSalesale(rig)
        break
      case 'play':
        poseMarayam(rig)
        break
      case 'raise':
        rig.arms[1].rotation.set(-1.01, -0.12, 0.49)
        joint(rig, 'elbow', 1).rotation.x = -1.55
        break
      case 'door-reveal':
        rig.figure.rotation.z = -0.14
        rig.head.rotation.set(-0.025, -0.12, 0.03)
        reachHand(rig, 0, new THREE.Vector3(-0.43, 1.61, 0.25))
        break
      case 'cradle':
        cradle(rig)
        break
    }
  }
}

function lightSalesaleRobe(root: THREE.Object3D, profile: HumanProfile) {
  const fabrics = new Map([
    [profile.jacket, new THREE.MeshLambertMaterial({ color: profile.jacket })],
    [profile.shirt, new THREE.MeshLambertMaterial({ color: 0xb9a98c })],
  ])
  root.traverse((part) => {
    if (!(part instanceof THREE.Mesh) || !(part.material instanceof THREE.MeshBasicMaterial)) {
      return
    }
    if (part.material.side !== THREE.FrontSide || !part.geometry.hasAttribute('normal')) return
    const fabric = fabrics.get(part.material.color.getHex())
    if (fabric) part.material = fabric
  })
}

function wink(rig: PoseRig) {
  const eye = rig.head.getObjectByName('face-eye-right')
  if (!eye?.parent) return
  eye.visible = false
  const line = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.028, -0.014, -0.001),
    new THREE.Vector3(-0.013, -0.002, 0.004),
    new THREE.Vector3(0.009, -0.003, 0.005),
    new THREE.Vector3(0.029, -0.017, 0.002),
  ])
  const lid = new THREE.Mesh(new THREE.TubeGeometry(line, 16, 0.0032, 6), glow(0x241a24, 1))
  lid.position.copy(eye.position)
  lid.position.z += 0.012
  lid.rotation.copy(eye.rotation)
  eye.parent.add(lid)
}

export function buildActor(actor: Actor, spaceId: string, floor: number) {
  const [x, y, z] = actor.position
  const pose = actor.pose ?? 'idle'
  const unmasked = actor.id === 'prince-tserriednich'
  const seen: HumanLook = {
    kind: 'avatar',
    id: actor.id,
    spaceId,
    tierId: 'tier-1',
    at: [x, z],
    y: y + floor,
    size: 0.42,
    colour: 0xc6b7a6,
    hidden: false,
    stage: 0,
    human: {
      identity: actor.id,
      pose,
      role: 'witness',
      aura: 'none',
      unmasked,
      royalCostume: actor.royalCostume,
    },
  }
  const profile = humanProfile(seen)
  const dressed = unmasked
    ? {
        ...profile,
        clothing: 'suit' as const,
        jacket: 0x25242b,
        shirt: 0xebdfd1,
      }
    : profile
  const human = buildHumanFigure({ THREE, glow, seen, profile: dressed })
  if (actor.id !== 'prince-woble') {
    improveFightBodyReadability(human.root)
    improveFightFace(human, dressed)
  }
  addFightRosterFinish({ THREE, model: human, profile: dressed })
  if (actor.id === 'prince-salesale') lightSalesaleRobe(human.root, dressed)
  human.root.position.set(x, y + floor, z)
  human.root.rotation.y = actor.heading ?? 0
  const rig = humanAnimationRig(human.turns)
  if (unmasked && rig) {
    const hair =
      rig.head.getObjectByName('manga-layered-hair') ?? rig.head.getObjectByName('manga-hair')
    if (hair) hair.visible = false
    rig.head.add(buildUncoveredTserriednich(rig.head))
  }
  if (actor.gesture === 'door-reveal' && rig) wink(rig)
  const glass = actor.gesture === 'toast' ? goblet() : null
  if (glass) human.root.add(glass)
  let supportLift: number | undefined
  return {
    root: human.root,
    head: rig?.head ?? human.turns,
    update(seconds: number) {
      human.animate(seconds, pose, { motion: gestureFor(actor.gesture, seconds) })
      if (rig && onSupport.has(actor.gesture)) {
        // Match the lowest part of the posed body to its actual support plane.
        // The shared seated offset is calibrated for an adult in a chair.
        supportLift ??= y + floor - shoeContact(rig)
        rig.figure.position.y += supportLift
      }
      if (glass && rig) {
        const hand = joint(rig, 'hand', 0)
        hand.getWorldPosition(glass.position)
        human.root.worldToLocal(glass.position)
        glass.position.y -= 0.026
        glass.position.z += 0.027
        glass.rotation.z = -0.09 + 0.05 * Math.sin(seconds * 2.2)
      }
    },
  }
}

const litMaterials = new WeakMap<THREE.Material, THREE.Material>()
const celSteps = new THREE.DataTexture(
  new Uint8Array([62, 62, 127, 127, 194, 194, 251, 251]),
  8,
  1,
  THREE.RedFormat,
)
celSteps.minFilter = THREE.NearestFilter
celSteps.magFilter = THREE.NearestFilter
celSteps.needsUpdate = true

function shadeBeast(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshBasicMaterial))
      return
    const source = object.material
    let shaded = litMaterials.get(source)
    if (!shaded) {
      const translucent = source.opacity < 0.48
      shaded = new THREE.MeshToonMaterial({
        color: source.color,
        side: source.side,
        gradientMap: celSteps,
        transparent: translucent,
        opacity: translucent ? source.opacity : 1,
        depthWrite: !translucent,
        vertexColors: source.vertexColors,
      })
      if (!translucent) {
        shaded.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <opaque_fragment>',
            `
            float rim = smoothstep(0.04, 0.23, abs(dot(normal, normalize(vViewPosition))));
            vec2 dotPosition = fract(gl_FragCoord.xy / 3.2) - 0.5;
            float stipple = 1.0 - (1.0 - smoothstep(0.12, 0.3, length(dotPosition))) * 0.13;
            outgoingLight *= mix(0.58, 1.0, rim) * stipple;
            #include <opaque_fragment>
          `,
          )
        }
      }
      litMaterials.set(source, shaded)
    }
    object.material = shaded
  })
}

const beastBuilders = [
  buildGuardianApparition,
  buildRoyalBeastApparition,
  buildMechanicalApparition,
  buildCrawlingApparition,
  buildSpriteApparition,
  buildDragonApparition,
  buildEmbellishmentApparition,
  buildWormPortal,
]
const grounded = new Set(['sprite', 'toad', 'chimera', 'dragon', 'portal'])

function finishBeast(root: THREE.Group) {
  const face = root.getObjectByName('female-head')
  if (face) face.rotation.y += 1.13
}

export function buildBeast(beast: Guardian, spaceId: string, floor: number) {
  const [x, y, z] = beast.position
  const root = new THREE.Group()
  const colour = beast.kind === 'wheel' ? 0xe7d5a3 : 0xabb4c3
  const seen: Apparition = {
    id: beast.kind,
    kind: beast.kind,
    spaceId,
    tierId: 'tier-1',
    at: [x, z],
    y: y + floor,
    size: beast.size,
    colour,
    stage: beast.stage ?? 0,
    hidden: false,
    ...(beast.kind === 'dragon' ? { variant: 'slender' } : {}),
  }
  const context = { THREE, glow, root, skin: glow(colour, 1) }
  for (const build of beastBuilders) build(seen, context)
  if (!root.children.length) throw new Error(`Missing Nen model: ${beast.kind}`)
  finishBeast(root)
  shadeBeast(root)
  const heading = beast.heading ?? 0
  root.position.set(x, y + floor, z)
  return {
    root,
    update(seconds: number) {
      const drift = grounded.has(beast.kind) ? 0 : Math.sin(seconds * 1.7) * 0.026
      root.position.y = y + floor + drift
      if (beast.kind === 'fume') root.position.x = x + 0.36 * Math.sin(seconds * 0.6)
      root.rotation.y = heading + drift * 0.42
    },
  }
}

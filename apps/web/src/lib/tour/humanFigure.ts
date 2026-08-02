import type { BufferGeometry, Group, Material, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'
import { humanAnimation } from './humanAnimation'
import {
  addMorenaDetails,
  addSilentMajorityCostume,
  addSilentMajorityMask,
} from './humanCostume'
import { humanProfile } from './humanProfiles'

type Three = typeof import('three')
type HumanLook = Apparition & { kind: 'avatar' | 'combatant' }

export interface HumanFigureBuild {
  THREE: Three
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  seen: HumanLook
}

export interface HumanFigure {
  root: Group
  turns: Object3D
  lod: { near: Group; far: Group }
  animate: (seconds: number) => void
}

export const HUMAN_INSTANCE_THRESHOLD = 20
export const HUMAN_LOD_DISTANCE = 24

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

interface OutlinedShape {
  THREE: Three
  geometry: BufferGeometry
  material: Material
  ink: Material
  scale?: number
}

function outlined({ THREE, geometry, material, ink, scale = 1.045 }: OutlinedShape): Group {
  const group = new THREE.Group()
  const edge = new THREE.Mesh(geometry, outlineMaterial(THREE, ink as MeshBasicMaterial))
  edge.scale.setScalar(scale)
  group.add(edge, new THREE.Mesh(geometry, material))
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
    scale: 1.055,
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

function legacyAura(seen: HumanLook): NonNullable<Apparition['human']>['aura'] {
  if (seen.human?.aura) return seen.human.aura
  if (seen.kind !== 'combatant') return 'none'
  return (['ten', 'ren', 'zetsu'] as const)[seen.stage % 3]
}

export function buildHumanFigure({ THREE, glow, seen }: HumanFigureBuild): HumanFigure {
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
  const arms: Group[] = []
  const legs: Group[] = []

  const pelvis = outlined({
    THREE,
    geometry: geometry(THREE, 'pelvis', () => new THREE.SphereGeometry(0.2, 8, 6)),
    material: cloth,
    ink,
  })
  const buildWidth = profile.build === 'slim' ? 0.92 : profile.build === 'broad' ? 1.12 : 1
  pelvis.scale.set(1.08 * buildWidth, 0.7, 0.76)
  pelvis.position.y = 0.76
  figure.add(pelvis)

  const torso = outlined({
    THREE,
    geometry: geometry(THREE, 'torso', () => new THREE.CylinderGeometry(0.22, 0.18, 0.58, 7)),
    material: cloth,
    ink,
  })
  torso.scale.set(profile.shoulders * buildWidth, 1, 0.72)
  torso.position.y = 1.12
  figure.add(torso)

  const collar = new THREE.Mesh(
    geometry(THREE, 'collar', () => new THREE.CylinderGeometry(0.13, 0.17, 0.1, 7)),
    glow(profile.shirt || SHIRT, 1),
  )
  collar.position.y = 1.43
  figure.add(collar)

  const neck = new THREE.Mesh(
    geometry(THREE, 'neck', () => new THREE.CylinderGeometry(0.075, 0.09, 0.14, 7)),
    skin,
  )
  neck.position.y = 1.51
  figure.add(neck)

  const head = new THREE.Group()
  head.position.y = 1.72
  const skull = outlined({
    THREE,
    geometry: geometry(THREE, 'skull', () => new THREE.SphereGeometry(0.19, 10, 8)),
    material: skin,
    ink,
  })
  skull.scale.set(
    profile.face === 'narrow' ? 0.82 : profile.face === 'square' ? 0.98 : 0.9,
    profile.face === 'round' ? 1.02 : 1.12,
    0.94,
  )
  head.add(skull)

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      geometry(THREE, 'eye', () => new THREE.PlaneGeometry(0.055, 0.014)),
      ink,
    )
    eye.name = side < 0 ? 'face-eye-left' : 'face-eye-right'
    eye.position.set(side * 0.062, 0.018, 0.181)
    eye.scale.y = profile.expression === 'tired' ? 0.65 : profile.expression === 'anxious' ? 1.4 : 1
    eye.rotation.z =
      profile.expression === 'hostile' || profile.expression === 'severe'
        ? side * -0.2
        : profile.expression === 'anxious'
          ? side * 0.1
          : side * -0.08
    head.add(eye)
    const brow = new THREE.Mesh(
      geometry(THREE, 'brow', () => new THREE.PlaneGeometry(0.064, 0.009)),
      ink,
    )
    brow.name = side < 0 ? 'face-brow-left' : 'face-brow-right'
    brow.position.set(side * 0.064, 0.06, 0.176)
    brow.scale.y = profile.expression === 'severe' ? 1.8 : 1
    brow.rotation.z =
      profile.expression === 'hostile'
        ? side * -0.28
        : profile.expression === 'anxious'
          ? side * 0.2
          : side * -0.12
    head.add(brow)
    const ear = new THREE.Mesh(
      geometry(THREE, 'ear', () => new THREE.SphereGeometry(0.035, 6, 4)),
      skin,
    )
    ear.scale.y = 1.35
    ear.position.x = side * 0.185
    head.add(ear)
  }
  const nose = new THREE.Mesh(
    geometry(THREE, 'nose', () => new THREE.ConeGeometry(0.022, 0.065, 4)),
    skin,
  )
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, -0.018, 0.195)
  head.add(nose)
  const mouth = new THREE.Mesh(
    geometry(THREE, 'mouth', () => new THREE.PlaneGeometry(0.07, 0.01)),
    ink,
  )
  mouth.position.set(0, -0.09, 0.178)
  mouth.name = 'face-mouth'
  head.add(mouth)
  const jawShade = new THREE.Mesh(
    geometry(THREE, 'face:jaw-shadow', () => new THREE.PlaneGeometry(0.14, 0.045)),
    glow(INK, 0.18),
  )
  jawShade.position.set(0, -0.145, 0.135)
  jawShade.rotation.x = -0.5
  head.add(jawShade)

  if (profile.hairStyle !== 'shaved') {
    const hair = outlined({
      THREE,
      geometry: geometry(
        THREE,
        'hair',
        () => new THREE.SphereGeometry(0.196, 9, 5, 0, Math.PI * 2, 0, 1.18),
      ),
      material: hairInk,
      ink,
      scale: 1.025,
    })
    hair.scale.set(0.94, profile.hairStyle === 'military' ? 0.86 : 1.08, 0.98)
    hair.position.y = profile.hairStyle === 'military' ? 0.035 : 0.015
    head.add(hair)

    if (profile.hairStyle === 'spiked') {
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(
          geometry(THREE, 'hair:spike', () => new THREE.ConeGeometry(0.045, 0.18, 4)),
          hairInk,
        )
        spike.position.set(i * 0.065, 0.2 + Math.abs(i) * -0.015, -0.01)
        spike.rotation.z = i * -0.13
        head.add(spike)
      }
    } else if (profile.hairStyle === 'long' || profile.hairStyle === 'ponytail') {
      const fall = new THREE.Mesh(
        geometry(THREE, 'hair:fall', () => new THREE.CylinderGeometry(0.12, 0.09, 0.48, 6)),
        hairInk,
      )
      fall.position.set(0, -0.16, -0.13)
      head.add(fall)
      if (profile.hairStyle === 'ponytail') {
        const tail = new THREE.Mesh(
          geometry(THREE, 'hair:tail', () => new THREE.ConeGeometry(0.075, 0.42, 6)),
          hairInk,
        )
        tail.position.set(0, -0.18, -0.25)
        tail.rotation.x = -0.35
        head.add(tail)
      }
    } else if (profile.hairStyle === 'swept') {
      const fringe = new THREE.Mesh(
        geometry(THREE, 'hair:fringe', () => new THREE.ConeGeometry(0.075, 0.3, 4)),
        hairInk,
      )
      fringe.position.set(-0.09, 0.08, 0.14)
      fringe.rotation.z = -0.55
      head.add(fringe)
    } else if (profile.hairStyle === 'bob') {
      for (const side of [-1, 1]) {
        const sideHair = new THREE.Mesh(
          geometry(THREE, 'hair:bob-side', () => new THREE.BoxGeometry(0.13, 0.38, 0.18)),
          hairInk,
        )
        sideHair.position.set(side * 0.145, -0.04, -0.005)
        sideHair.rotation.z = side * -0.08
        head.add(sideHair)
      }
    }
  }

  if (seen.human?.role === 'silent-majority') {
    addSilentMajorityMask({ THREE, geometry, glow, ink, head })
  }
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
  belt.position.y = 0.82
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
    addMorenaDetails({
      THREE,
      geometry,
      outlined,
      figure,
      head,
      cloth,
      ink,
      accent,
      dark,
      skin,
    })
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
    leg.position.set(side * 0.13, 0.77, 0)
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
    hand.position.y = -0.25
    elbow.add(hand)
    arm.position.set(side * 0.3 * profile.shoulders, 1.34, 0)
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

  if (pose === 'guard') {
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1
      arm.position.set(side * 0.22, 1.31, 0.08)
      arm.rotation.set(-0.78, 0, side * -0.64)
      elbows[index].rotation.x = -1.05
    })
    legs[0].rotation.z = -0.08
    legs[1].rotation.z = 0.08
  } else if (pose === 'attack') {
    arms[1].position.set(0.18, 1.3, 0.15)
    arms[1].rotation.set(-1.35, 0, -0.08)
    elbows[1].rotation.x = -0.35
  } else if (pose === 'listen') {
    arms[1].rotation.set(0, 0, -2.15)
  } else if (pose === 'search') {
    figure.rotation.x = -0.12
    head.rotation.x = 0.22
    knees.forEach((knee) => (knee.rotation.x = 0.18))
  } else if (pose === 'held') {
    figure.rotation.z = -0.24
    figure.position.x = 0.12
  } else if (pose === 'fallen') {
    figure.rotation.z = 1.3
    figure.position.y = 0.25
    arms[0].rotation.z = 0.7
    arms[1].rotation.z = -0.9
    elbows[0].rotation.x = -0.55
    knees[1].rotation.x = 0.65
  } else if (pose === 'walk') {
    arms[0].rotation.x = -0.32
    arms[1].rotation.x = 0.32
    legs[0].rotation.x = 0.2
    legs[1].rotation.x = -0.2
  } else if (pose === 'seated') {
    figure.position.y = -0.25
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1
      arm.position.set(side * 0.27, 1.29, 0.02)
      arm.rotation.set(-0.72, 0, side * -0.12)
      elbows[index].rotation.x = -1.12
    })
    legs.forEach((leg, index) => {
      const side = index === 0 ? -1 : 1
      leg.position.x = side * 0.14
      leg.rotation.x = -Math.PI / 2
      knees[index].rotation.x = Math.PI / 2
    })
  }

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

  const aura = legacyAura(seen)
  if (aura === 'ten' || aura === 'ren') {
    const shell = new THREE.Mesh(
      geometry(
        THREE,
        `aura:${aura}`,
        () => new THREE.SphereGeometry(aura === 'ren' ? 0.9 : 0.72, 18, 12),
      ),
      glow(seen.colour, aura === 'ren' ? 0.16 : 0.07),
    )
    shell.scale.y = 1.35
    shell.position.y = 0.9
    figure.add(shell)
  }

  const farBody = new THREE.Mesh(
    geometry(THREE, 'far:body', () => new THREE.CylinderGeometry(0.2, 0.14, 1.2, 5)),
    cloth,
  )
  farBody.position.y = 0.72
  far.add(farBody)
  const farHead = new THREE.Mesh(
    geometry(THREE, 'far:head', () => new THREE.SphereGeometry(0.18, 6, 4)),
    skin,
  )
  farHead.position.y = 1.52
  far.add(farHead)
  const farHair = new THREE.Mesh(
    geometry(
      THREE,
      'far:hair',
      () => new THREE.SphereGeometry(0.185, 6, 3, 0, Math.PI * 2, 0, 1.2),
    ),
    hairInk,
  )
  farHair.position.y = 1.54
  far.add(farHair)
  far.scale.setScalar(unit)
  far.position.copy(figure.position)
  far.rotation.copy(figure.rotation)

  const animate = humanAnimation({ pose, figure, torso, pelvis, head, arms, legs, knees })

  return { root, turns: figure, lod: { near: figure, far }, animate }
}

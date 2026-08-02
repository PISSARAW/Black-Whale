/** Shared low-poly, manga-shaped human used by tour-derived game modes. */
import type { BufferGeometry, Group, Material, MeshBasicMaterial, Object3D } from 'three'
import type { Apparition } from './apparitions'

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
}

/** Instancing only becomes worthwhile beyond the populations used today. */
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
}

function limb({ THREE, glow, seen, radius, length }: LimbShape): Group {
  return outlined({
    THREE,
    geometry: geometry(THREE, `limb:${radius}:${length}`, () =>
      new THREE.CapsuleGeometry(radius, length, 3, 7),
    ),
    material: glow(seen.colour, 1),
    ink: glow(INK, 1),
    scale: 1.055,
  })
}

function legacyPose(seen: HumanLook): NonNullable<Apparition['human']>['pose'] {
  if (seen.human) return seen.human.pose
  const pose = Math.floor(seen.stage / 3)
  return pose === 1 ? 'guard' : pose === 2 ? 'held' : pose === 3 ? 'fallen' : pose === 4 ? 'attack' : 'idle'
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
  const unit = seen.kind === 'avatar' ? seen.size / 0.42 : seen.size
  figure.scale.setScalar(unit)
  root.add(figure)
  root.add(far)
  far.visible = false

  const ink = glow(INK, 1)
  const cloth = glow(seen.colour, 0.98)
  const skin = glow(SKIN, 1)
  const dark = glow(BOOTS, 1)
  const pose = legacyPose(seen)
  const arms: Group[] = []
  const legs: Group[] = []

  const pelvis = outlined({
    THREE,
    geometry: geometry(THREE, 'pelvis', () => new THREE.SphereGeometry(0.2, 8, 6)),
    material: cloth,
    ink,
  })
  pelvis.scale.set(1.08, 0.7, 0.76)
  pelvis.position.y = 0.76
  figure.add(pelvis)

  const torso = outlined({
    THREE,
    geometry: geometry(THREE, 'torso', () => new THREE.CylinderGeometry(0.22, 0.18, 0.58, 7)),
    material: cloth,
    ink,
  })
  torso.scale.z = 0.72
  torso.position.y = 1.12
  figure.add(torso)

  const collar = new THREE.Mesh(
    geometry(THREE, 'collar', () => new THREE.CylinderGeometry(0.13, 0.17, 0.1, 7)),
    glow(SHIRT, 1),
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
  skull.scale.set(0.9, 1.12, 0.94)
  head.add(skull)

  // Graphic facial planes: readable like ink marks, not realistic textures.
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      geometry(THREE, 'eye', () => new THREE.PlaneGeometry(0.055, 0.014)),
      ink,
    )
    eye.position.set(side * 0.062, 0.018, 0.181)
    eye.rotation.z = side * -0.08
    head.add(eye)
    const brow = new THREE.Mesh(
      geometry(THREE, 'brow', () => new THREE.PlaneGeometry(0.064, 0.009)),
      ink,
    )
    brow.position.set(side * 0.064, 0.06, 0.176)
    brow.rotation.z = side * -0.12
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
  head.add(mouth)

  const hair = outlined({
    THREE,
    geometry: geometry(THREE, 'hair', () =>
      new THREE.SphereGeometry(0.196, 9, 5, 0, Math.PI * 2, 0, 1.18),
    ),
    material: dark,
    ink,
    scale: 1.025,
  })
  hair.scale.set(0.94, 1.08, 0.98)
  hair.position.y = 0.015
  head.add(hair)
  figure.add(head)

  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    const thigh = limb({ THREE, glow, seen, radius: 0.085, length: 0.28 })
    thigh.position.y = -0.18
    leg.add(thigh)
    const shin = limb({ THREE, glow, seen, radius: 0.07, length: 0.27 })
    shin.position.y = -0.5
    leg.add(shin)
    const shoe = outlined({
      THREE,
      geometry: geometry(THREE, 'shoe', () => new THREE.BoxGeometry(0.15, 0.09, 0.25)),
      material: dark,
      ink,
    })
    shoe.position.set(0, -0.7, 0.055)
    leg.add(shoe)
    leg.position.set(side * 0.13, 0.77, 0)
    figure.add(leg)
    legs.push(leg)

    const arm = new THREE.Group()
    const upper = limb({ THREE, glow, seen, radius: 0.062, length: 0.22 })
    upper.position.y = -0.14
    arm.add(upper)
    const forearm = limb({ THREE, glow, seen, radius: 0.052, length: 0.2 })
    forearm.position.y = -0.4
    arm.add(forearm)
    const hand = new THREE.Mesh(
      geometry(THREE, 'hand', () => new THREE.SphereGeometry(0.062, 7, 5)),
      skin,
    )
    hand.position.y = -0.57
    arm.add(hand)
    arm.position.set(side * 0.3, 1.34, 0)
    arm.rotation.z = side * -0.1
    figure.add(arm)
    arms.push(arm)
  }

  if (pose === 'guard') {
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1
      arm.position.set(side * 0.22, 1.31, 0.08)
      arm.rotation.set(-0.78, 0, side * -0.64)
    })
    legs[0].rotation.z = -0.08
    legs[1].rotation.z = 0.08
  } else if (pose === 'attack') {
    arms[1].position.set(0.18, 1.3, 0.15)
    arms[1].rotation.set(-1.35, 0, -0.08)
  } else if (pose === 'listen') {
    arms[1].rotation.set(0, 0, -2.15)
  } else if (pose === 'search') {
    figure.rotation.x = -0.12
    head.rotation.x = 0.22
  } else if (pose === 'held') {
    figure.rotation.z = -0.24
    figure.position.x = 0.12
  } else if (pose === 'fallen') {
    figure.rotation.z = 1.3
    figure.position.y = 0.25
  } else if (pose === 'walk') {
    arms[0].rotation.x = -0.32
    arms[1].rotation.x = 0.32
    legs[0].rotation.x = 0.2
    legs[1].rotation.x = -0.2
  }

  const aura = legacyAura(seen)
  if (aura === 'ten' || aura === 'ren') {
    const shell = new THREE.Mesh(
      geometry(THREE, `aura:${aura}`, () =>
        new THREE.SphereGeometry(aura === 'ren' ? 0.9 : 0.72, 18, 12),
      ),
      glow(seen.colour, aura === 'ren' ? 0.16 : 0.07),
    )
    shell.scale.y = 1.35
    shell.position.y = 0.9
    figure.add(shell)
  }

  // The distant silhouette drops facial planes, joints, outlines and aura to
  // three shared meshes. At that range those details occupy less than a pixel.
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
    geometry(THREE, 'far:hair', () =>
      new THREE.SphereGeometry(0.185, 6, 3, 0, Math.PI * 2, 0, 1.2),
    ),
    dark,
  )
  farHair.position.y = 1.54
  far.add(farHair)
  far.scale.setScalar(unit)
  far.position.copy(figure.position)
  far.rotation.copy(figure.rotation)

  return { root, turns: figure, lod: { near: figure, far } }
}

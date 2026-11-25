import type { BufferAttribute, BufferGeometry, Euler, Group, Mesh, Object3D, Vector3 } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'
import { addFightHandGripResponse, animateFightHandGripResponse } from './fightHandGrip'

type Three = HumanFigureBuild['THREE']

interface RestTransform {
  position: Vector3
  rotation: Euler
  scale: Vector3
}

interface MaterialResponse {
  hands: Mesh[]
  thumbs: Object3D[]
  thumbRest: RestTransform[]
  shoes: Object3D[]
  shoeRest: RestTransform[]
  tie?: Object3D
  tieRest?: RestTransform
  hems: Group[]
  hemRest: RestTransform[]
  drapes: Object3D[]
  drapeRest: RestTransform[]
}

const MODELS = new WeakMap<Object3D, MaterialResponse>()
const GRIP_GEOMETRY = new WeakMap<BufferGeometry, BufferGeometry>()
const HEM_GEOMETRY = new WeakMap<object, BufferGeometry>()

/**
 * Register the roster's material response without adding simulation state.
 * Hand morphing changes vertices only, so held equipment keeps its own scale.
 */
export function addFightMaterialResponse(options: {
  THREE: Three
  model: HumanFigure
  profile: HumanProfile
}): void {
  const { THREE, model, profile } = options
  addFightHandGripResponse(model)
  if (!profile.likeness || MODELS.has(model.turns)) return
  const hands = ['left', 'right']
    .map((side) => model.root.getObjectByName(`hand-${side}`))
    .filter((part): part is Mesh => (part as Mesh | undefined)?.isMesh === true)
  const thumbs = hands.map((hand) => hand.children.find((child) => (child as Mesh).isMesh) ?? hand)
  for (const hand of hands) {
    hand.geometry = gripGeometry(THREE, hand.geometry)
    hand.updateMorphTargets()
  }
  const shoes = ['left', 'right']
    .map((side) => model.root.getObjectByName(`knee-${side}`)?.children[1])
    .filter((part): part is Object3D => Boolean(part))
  const hems = profile.likeness === 'kurapika' ? addJacketHems(THREE, model) : []
  const tie = findNamed(model.root, [
    'kurapika-tie',
    'manga-tie',
    'marayam-bowtie',
    'luzurus-puff-tie',
  ])
  const drapes = findNamedAll(model.root, [
    'machi-sash-tails',
    'hinrigh-jacket-tail',
    'mizaistom-jacket-hem',
    'salesale-robe-hem',
    'zhanglei-tunic-hem-trim',
    'manga-long-coat',
    'chrollo-long-cross-coat',
    'beyond-loose-robe',
    'biscuit-petal-skirt',
    'camilla-skirt',
  ])
  MODELS.set(model.turns, {
    hands,
    thumbs,
    thumbRest: thumbs.map(restOf),
    shoes,
    shoeRest: shoes.map(restOf),
    tie,
    tieRest: tie ? restOf(tie) : undefined,
    hems,
    hemRest: hems.map(restOf),
    drapes,
    drapeRest: drapes.map(restOf),
  })
  model.turns.userData.materialResponse = 'roster-extremities-and-tailoring'
  model.turns.userData.flexibleGarments = Number(Boolean(tie)) + hems.length + drapes.length
}

/** Apply deterministic pose response after the current combat state is known. */
export function animateFightMaterialResponse(figure: Object3D, fighter: ArcadeFighter): void {
  animateFightHandGripResponse(figure, fighter)
  const model = MODELS.get(figure)
  if (!model) return
  const response = attackResponse(fighter)
  const lead = fighter.facing === 1 ? 1 : 0
  const rear = 1 - lead
  const grips: [number, number] = [0.24, 0.24]
  if (fighter.attack?.kind === 'ranged') {
    const occupied = model.hands.map((hand) =>
      hand.children.some(
        (child) =>
          child.visible &&
          /(handgun|rifle|pistol|book|fan|needle|flute|blinky|umbrella)/.test(child.name),
      ),
    )
    const weapon = occupied[0] ? 0 : occupied[1] ? 1 : lead
    grips[weapon] = 0.98
    grips[1 - weapon] = 0.52
  } else if (fighter.attack) {
    const legStrike =
      fighter.attack.kind === 'heavy' && ['low', 'air'].includes(fighter.attack.variant ?? '')
    grips[lead] = legStrike ? 0.58 : 0.28 + response.strength * 0.72
    grips[rear] = 0.46 + response.strength * 0.22
  }
  model.hands.forEach((hand, index) => {
    if (hand.morphTargetInfluences) hand.morphTargetInfluences[0] = grips[index]
    const thumb = model.thumbs[index]
    const rest = model.thumbRest[index]
    thumb.position.copy(rest.position)
    thumb.rotation.copy(rest.rotation)
    thumb.position.y -= grips[index] * 0.008
    thumb.position.z += grips[index] * 0.01
    thumb.rotation.x += grips[index] * 0.42
    thumb.rotation.z += (index === 0 ? -1 : 1) * grips[index] * 0.5
  })

  model.shoes.forEach((shoe, index) => {
    const rest = model.shoeRest[index]
    shoe.position.copy(rest.position)
    shoe.rotation.copy(rest.rotation)
    shoe.scale.copy(rest.scale)
    const kicking =
      index === lead &&
      fighter.attack?.kind === 'heavy' &&
      ['low', 'air'].includes(fighter.attack.variant ?? '')
    const compression = response.strength * (kicking ? 0.08 : index === rear ? 0.05 : 0.025)
    shoe.scale.x *= 1 + compression * 0.45
    shoe.scale.y *= 1 - compression
    shoe.scale.z *= 1 + compression * (kicking ? 1.1 : 0.5)
    shoe.position.y += compression * 0.012
  })

  const travel = clothTravel(fighter, response)
  if (model.tie && model.tieRest) {
    model.tie.position.copy(model.tieRest.position)
    model.tie.rotation.copy(model.tieRest.rotation)
    model.tie.rotation.x += Math.abs(travel) * 0.32
    model.tie.rotation.z -= travel * 0.72
  }
  model.hems.forEach((hem, index) => {
    const rest = model.hemRest[index]
    const side = index === 0 ? -1 : 1
    hem.position.copy(rest.position)
    hem.rotation.copy(rest.rotation)
    hem.rotation.x -= Math.abs(travel) * 0.58
    hem.rotation.y += travel * side * 0.34
    hem.rotation.z -= travel * side * 0.16
  })
  model.drapes.forEach((drape, index) => {
    const rest = model.drapeRest[index]
    drape.position.copy(rest.position)
    drape.rotation.copy(rest.rotation)
    drape.position.z -= Math.abs(travel) * 0.018
    drape.rotation.x -= Math.abs(travel) * 0.12
    drape.rotation.z -= travel * 0.08
  })
}

function attackResponse(fighter: ArcadeFighter): { strength: number; travel: number } {
  const attack = fighter.attack
  const move = moveById(attack?.moveId)
  if (!attack || !move) return { strength: 0, travel: 0 }
  const { startup, active, recovery } = move.tuning
  if (attack.frame < startup) {
    const t = clamp01(attack.frame / Math.max(1, startup))
    return { strength: t * 0.72, travel: -t * 0.08 }
  }
  if (attack.frame < startup + active) {
    const t = clamp01((attack.frame - startup) / Math.max(1, active))
    return { strength: 1, travel: 0.13 - t * 0.025 }
  }
  const t = clamp01((attack.frame - startup - active) / Math.max(1, recovery))
  const decay = (1 - t) ** 2
  return {
    strength: 0.24 + decay * 0.76,
    travel: Math.sin(t * Math.PI * 2.2) * 0.085 * decay,
  }
}

function clothTravel(fighter: ArcadeFighter, response: ReturnType<typeof attackResponse>): number {
  const velocity = clamp((fighter.motion?.velocityX ?? 0) * 0.0018, -0.045, 0.045)
  const airborne = fighter.y > 0 ? Math.sin((fighter.attack?.frame ?? 0) * 0.17) * 0.012 : 0
  return clamp((response.travel - velocity) * fighter.facing + airborne, -0.14, 0.14)
}

function gripGeometry(THREE: Three, source: BufferGeometry): BufferGeometry {
  const held = GRIP_GEOMETRY.get(source)
  if (held) return held
  const geometry = source.clone()
  const position = geometry.getAttribute('position') as BufferAttribute
  const delta = new Float32Array(position.count * 3)
  for (let index = 0; index < position.count; index++) {
    const y = position.getY(index)
    if (y >= -0.012) continue
    const curl = clamp01((-y - 0.012) / 0.06)
    delta[index * 3 + 1] = curl * 0.034
    delta[index * 3 + 2] = curl * 0.036
  }
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(delta, 3)]
  geometry.morphTargetsRelative = true
  geometry.userData = { ...geometry.userData, sharedHuman: true, fightGripMorph: true }
  GRIP_GEOMETRY.set(source, geometry)
  return geometry
}

function addJacketHems(THREE: Three, model: HumanFigure): Group[] {
  const torso = model.root.getObjectByName('torso')
  if (!torso) return []
  const meshes = torso.children.filter((child): child is Mesh => (child as Mesh).isMesh === true)
  const edgeMaterial = meshes[0]?.material
  const surfaceMaterial = meshes[1]?.material
  if (
    !edgeMaterial ||
    !surfaceMaterial ||
    Array.isArray(edgeMaterial) ||
    Array.isArray(surfaceMaterial)
  )
    return []
  const geometry = hemGeometry(THREE)
  return [-1, 1].map((side) => {
    const hem = new THREE.Group()
    hem.name = side < 0 ? 'kurapika-jacket-hem-left' : 'kurapika-jacket-hem-right'
    hem.position.set(side * 0.06, -0.205, 0.087)
    const edge = new THREE.Mesh(geometry, edgeMaterial)
    edge.scale.set(1.055, 1.035, 1.08)
    const surface = new THREE.Mesh(geometry, surfaceMaterial)
    hem.add(edge, surface)
    torso.add(hem)
    return hem
  })
}

function hemGeometry(THREE: Three): BufferGeometry {
  const key = THREE as unknown as object
  const held = HEM_GEOMETRY.get(key)
  if (held) return held
  const geometry = new THREE.BoxGeometry(0.112, 0.18, 0.014).translate(0, -0.09, 0)
  geometry.userData = { ...geometry.userData, sharedHuman: true, fightJacketHem: true }
  HEM_GEOMETRY.set(key, geometry)
  return geometry
}

function restOf(part: Object3D): RestTransform {
  return {
    position: part.position.clone(),
    rotation: part.rotation.clone(),
    scale: part.scale.clone(),
  }
}

function findNamed(root: Object3D, names: readonly string[]): Object3D | undefined {
  for (const name of names) {
    const part = root.getObjectByName(name)
    if (part) return part
  }
}

function findNamedAll(root: Object3D, names: readonly string[]): Object3D[] {
  return names.flatMap((name) => {
    const part = root.getObjectByName(name)
    return part ? [part] : []
  })
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

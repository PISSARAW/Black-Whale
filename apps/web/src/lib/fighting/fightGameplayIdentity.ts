import type { BufferGeometry, Group, Material, Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

type Three = HumanFigureBuild['THREE']

interface IdentityGeometry {
  hairLock: BufferGeometry
  lapelEdge: BufferGeometry
  chainBand: BufferGeometry
}

const GEOMETRY = new WeakMap<object, IdentityGeometry>()

/**
 * Kurapika's fight-camera identity lock.
 *
 * These are broad, canonical value breaks rather than glow or UI markers. Each
 * feature stays large enough to survive the normal camera while remaining a
 * child of the body part that owns it.
 */
export function addFightGameplayIdentity(options: {
  THREE: Three
  model: HumanFigure
  profile: HumanProfile
}): void {
  const { THREE, model, profile } = options
  if (profile.likeness !== 'kurapika' || model.root.getObjectByName('fight-gameplay-identity'))
    return
  const identity = new THREE.Group()
  identity.name = 'fight-gameplay-identity'
  identity.userData.cameraContract = { height: 560, minimumFeaturePixels: 3 }
  model.turns.add(identity)

  const geometry = identityGeometry(THREE)
  const hairShadow = material(THREE, darken(profile.hair, 0.62))
  const jacketEdge = material(THREE, lighten(profile.jacket, 0.38))
  const chainMetal = material(THREE, 0xc6cbd2)
  addHairLocks(THREE, model.root, geometry.hairLock, hairShadow)
  addLapelEdges(THREE, model.root, geometry.lapelEdge, jacketEdge)
  addChainBand(THREE, model.root, geometry.chainBand, chainMetal)
  mountTailoringOnTorso(model.root)
  strengthenFrontRead(model.root)
}

function addHairLocks(
  THREE: Three,
  root: Object3D,
  geometry: BufferGeometry,
  material: Material,
): void {
  const head = root.getObjectByName('kurapika-head')
  if (!head) return
  for (const side of [-1, 1]) {
    const lock = new THREE.Mesh(geometry, material)
    lock.name = side < 0 ? 'kurapika-camera-lock-left' : 'kurapika-camera-lock-right'
    lock.position.set(side * 0.135, -0.012, 0.149)
    lock.rotation.z = side * -0.055
    lock.scale.x = side
    head.add(lock)
  }
}

function addLapelEdges(
  THREE: Three,
  root: Object3D,
  geometry: BufferGeometry,
  material: Material,
): void {
  const torso = root.getObjectByName('torso')
  if (!torso) return
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(geometry, material)
    edge.name = side < 0 ? 'kurapika-camera-lapel-left' : 'kurapika-camera-lapel-right'
    edge.position.set(side * 0.075, 0.18, 0.105)
    edge.rotation.z = side * -0.32
    torso.add(edge)
  }
}

function addChainBand(
  THREE: Three,
  root: Object3D,
  geometry: BufferGeometry,
  material: Material,
): void {
  const hand = root.getObjectByName('hand-right')
  if (!hand) return
  const band = new THREE.Mesh(geometry, material)
  band.name = 'kurapika-camera-chain-band'
  band.position.y = 0.054
  band.rotation.x = Math.PI / 2
  hand.add(band)
}

/** P14 seams were figure decorations; P19 makes them actual torso tailoring. */
function mountTailoringOnTorso(root: Object3D): void {
  const torso = root.getObjectByName('torso')
  if (!torso) return
  root.updateMatrixWorld(true)
  for (const side of ['left', 'right']) {
    const seam = root.getObjectByName(`kurapika-jacket-seam-${side}`)
    if (seam) torso.attach(seam)
  }
}

function strengthenFrontRead(root: Object3D): void {
  for (const name of ['kurapika-collar-left', 'kurapika-collar-right']) {
    const collar = root.getObjectByName(name)
    if (collar) collar.scale.multiplyScalar(1.06)
  }
  const tie = root.getObjectByName('kurapika-tie')
  if (tie) tie.scale.x *= 1.12
}

function identityGeometry(THREE: Three): IdentityGeometry {
  const key = THREE as unknown as object
  const held = GEOMETRY.get(key)
  if (held) return held
  const shape = new THREE.Shape()
  shape.moveTo(-0.019, 0.065)
  shape.lineTo(0.019, 0.055)
  shape.lineTo(0.024, -0.062)
  shape.lineTo(0, -0.108)
  shape.lineTo(-0.024, -0.058)
  shape.closePath()
  const made = {
    hairLock: new THREE.ShapeGeometry(shape),
    lapelEdge: new THREE.BoxGeometry(0.009, 0.205, 0.007),
    chainBand: new THREE.TorusGeometry(0.034, 0.006, 5, 12),
  }
  for (const geometry of Object.values(made))
    geometry.userData = { ...geometry.userData, sharedHuman: true, gameplayIdentity: true }
  GEOMETRY.set(key, made)
  return made
}

function material(THREE: Three, colour: number): Material {
  return new THREE.MeshBasicMaterial({ color: colour, toneMapped: false })
}

function darken(colour: number, amount: number): number {
  const channel = (shift: number) => Math.round(((colour >> shift) & 0xff) * amount)
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}

function lighten(colour: number, amount: number): number {
  const channel = (value: number) => Math.round(value + (255 - value) * amount)
  return (
    (channel((colour >> 16) & 0xff) << 16) |
    (channel((colour >> 8) & 0xff) << 8) |
    channel(colour & 0xff)
  )
}

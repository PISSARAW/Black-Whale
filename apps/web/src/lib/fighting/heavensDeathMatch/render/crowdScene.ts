import * as Three from 'three'
import type { SceneryKit } from '../../stageKit'
import { headsOf } from '../crowd/heads'
import { crowdInstances, type CrowdInstance } from '../crowd/lod'
import type { CrowdState } from '../crowd/types'
import { buildHumanFigure, type HumanFigure, type HumanLook } from '../../../tour/humanFigure'
import { humanProfile } from '../../../tour/humanProfiles'
import { humanAnimationRig, type HumanPose } from '../../../tour/humanAnimation'
import type { Vec3 } from '../stands/geometry'

/** Clothes of the Heavens Arena crowd, the palette the drawn blocks used. */
export const CROWD_PALETTE = [0x6f5a4c, 0x8a6d5a, 0x4d5b70, 0x7a4040, 0x5d6b4a, 0x9a8a72, 0x3f4656]
const HAIR = [0x1d1a18, 0x3b2a1e, 0x6a4a2c, 0x8f8a80, 0x2a2420]
const SKIN = 0xc9a387
const HEAD_RADIUS = 0.11

export interface CrowdScene {
  root: Three.Group
  /** Draws every body where the crowd simulation has it. */
  sync: (crowd: CrowdState, seconds?: number, focus?: Vec3) => void
}

interface Meshes {
  heads: Three.InstancedMesh
  placed: Three.Object3D
  colour: Three.Color
  skin: Three.Color
}

function placeDetachedHead(meshes: Meshes, at: { x: number; y: number; z: number }, index: number) {
  const { placed, colour } = meshes
  placed.position.set(at.x, at.y, at.z)
  placed.rotation.set(0, 0, 0)
  placed.scale.setScalar(1)
  placed.updateMatrix()
  meshes.heads.setMatrixAt(index, placed.matrix)
  colour.setHex(HAIR[index % HAIR.length])
  meshes.heads.setColorAt(index, colour.lerp(meshes.skin, 0.35))
}

interface CrowdCharacter {
  figure: HumanFigure
  character: string
  pose: HumanPose | null
  head?: Three.Object3D
}

/** The character a crowd body stands for, posed like the body that stands there. */
function buildCharacter(kit: SceneryKit, character: string): CrowdCharacter {
  const seen: HumanLook = {
    id: `crowd:${character}`,
    kind: 'combatant',
    spaceId: 'clash-background',
    tierId: 'arcade-stage',
    at: [0, 0],
    y: 0,
    size: 1,
    colour: 0xcbbf9a,
    stage: 0,
    hidden: false,
    human: { identity: character, role: 'fighter', pose: 'idle', aura: 'none' },
  }
  const glow: (colour: number, opacity: number) => Three.MeshBasicMaterial = (colour, opacity) =>
    new Three.MeshBasicMaterial({ color: colour, opacity })
  const figure = buildHumanFigure({ THREE: kit.THREE, glow, seen, profile: humanProfile(seen) })
  return { figure, character, pose: null, head: humanAnimationRig(figure.turns)?.head }
}

/** The pose a character body stands in, from the posture the crowd simulated. */
function characterPose(body: CrowdInstance): HumanPose {
  if (body.posture === 'seated') return 'seated'
  if (body.posture === 'held') return 'held'
  if (body.posture === 'dead' || body.posture === 'injured') return 'fallen'
  return 'idle'
}

function placeCharacter(char: CrowdCharacter, body: CrowdInstance): void {
  char.figure.root.position.set(body.at.x, body.at.y, body.at.z)
  char.figure.root.rotation.y = Math.sign(body.at.x) * 0.12
}

function poseCharacter(
  character: CrowdCharacter,
  body: CrowdInstance,
  options: { seconds?: number; focus?: Vec3 },
): void {
  const { figure, head } = character
  const { focus, seconds } = options
  const pose = characterPose(body)
  const near =
    !focus || Math.hypot(body.at.x - focus.x, body.at.y - focus.y, body.at.z - focus.z) < 9
  figure.lod.near.visible = near
  figure.lod.far.visible = !near
  if (head) head.visible = !body.headless
  if (near) {
    if (character.pose !== pose || seconds !== undefined) figure.animate(seconds ?? 0, pose, {})
    character.pose = pose
    return
  }
  figure.lod.far.rotation.z = pose === 'fallen' ? Math.PI / 2 : 0
  figure.lod.far.position.y = pose === 'seated' ? -0.5 : 0
  for (const detail of figure.lod.far.children.slice(1)) detail.visible = !body.headless
}

/** Places the heads the crowd still carries, detached from their bodies. */
function placeCrowdHeads(meshes: Meshes, crowd: CrowdState, capacity: number): number {
  let headCount = 0
  for (const head of headsOf(crowd)) {
    if (head.spent || headCount >= capacity) continue
    placeDetachedHead(meshes, head.at, headCount)
    headCount += 1
  }
  meshes.heads.count = headCount
  meshes.heads.instanceMatrix.needsUpdate = true
  if (meshes.heads.instanceColor) meshes.heads.instanceColor.needsUpdate = true
  return headCount
}

/**
 * Human bodies and detached heads, one pair per spectator, up to `capacity`.
 *
 * Every human body in the hall — character, referee or anonymous crowd member —
 * is drawn as a human figure posed like the body that stands there; the bodies
 * without a declared likeness run on the generic simplified profile.
 */
export function buildCrowdScene(kit: SceneryKit, capacity: number): CrowdScene {
  const { THREE, glow, geometry } = kit
  const root = new THREE.Group()
  const meshes: Meshes = {
    heads: new THREE.InstancedMesh(
      geometry(new THREE.SphereGeometry(HEAD_RADIUS, 8, 6)),
      glow(0xffffff, 1),
      capacity,
    ),
    placed: new Three.Object3D(),
    colour: new Three.Color(),
    skin: new Three.Color(SKIN),
  }
  root.add(meshes.heads)
  const characters = new Map<string, CrowdCharacter>()
  const characterFor = (id: string, identity: string): CrowdCharacter => {
    const cached = characters.get(id)
    if (cached?.character === identity) return cached
    if (cached) root.remove(cached.figure.root)
    const made = buildCharacter(kit, identity)
    root.add(made.figure.root)
    characters.set(id, made)
    return made
  }
  return {
    root,
    sync(crowd, seconds, focus) {
      const bodies = crowdInstances(crowd).slice(0, capacity)
      const visible = new Set(bodies.map((body) => body.id))
      for (const [id, { figure }] of characters) figure.root.visible = visible.has(id)
      placeCrowdHeads(meshes, crowd, capacity)
      for (const body of bodies) {
        const identity = body.character ?? (body.referee ? 'referee' : `crowd:${body.id}`)
        const character = characterFor(body.id, identity)
        placeCharacter(character, body)
        poseCharacter(character, body, { seconds, focus })
      }
    },
  }
}

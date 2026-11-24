import * as Three from 'three'
import type { SceneryKit } from '../../stageKit'
import { headsOf } from '../crowd/heads'
import { crowdInstances, type CrowdInstance } from '../crowd/lod'
import type { CrowdState } from '../crowd/types'
import { buildHumanFigure, type HumanFigure, type HumanLook } from '../../../tour/humanFigure'
import { humanProfile } from '../../../tour/humanProfiles'
import type { HumanPose } from '../../../tour/humanAnimation'

/** Clothes of the Heavens Arena crowd, the palette the drawn blocks used. */
export const CROWD_PALETTE = [0x6f5a4c, 0x8a6d5a, 0x4d5b70, 0x7a4040, 0x5d6b4a, 0x9a8a72, 0x3f4656]
const HAIR = [0x1d1a18, 0x3b2a1e, 0x6a4a2c, 0x8f8a80, 0x2a2420]
const SKIN = 0xc9a387
const HEAD_RADIUS = 0.11

export interface CrowdScene {
  root: Three.Group
  /** Draws every body where the crowd simulation has it. */
  sync: (crowd: CrowdState, seconds?: number) => void
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
  pose: HumanPose
}

/** The character a crowd body stands for, posed like the body that stands there. */
function buildCharacter(kit: SceneryKit, character: string, pose: HumanPose): CrowdCharacter {
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
    human: { identity: character, role: 'fighter', pose, aura: 'none' },
  }
  const glow: (colour: number, opacity: number) => Three.MeshBasicMaterial = (colour, opacity) =>
    new Three.MeshBasicMaterial({ color: colour, opacity })
  const figure = buildHumanFigure({ THREE: kit.THREE, glow, seen, profile: humanProfile(seen) })
  return { figure, character, pose }
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
  const characterFor = (character: string, pose: HumanPose): CrowdCharacter => {
    const made = characters.get(character) ?? buildCharacter(kit, character, pose)
    if (!characters.has(character)) root.add(made.figure.root)
    characters.set(character, made)
    return made
  }
  return {
    root,
    sync(crowd, seconds) {
      const bodies = crowdInstances(crowd).slice(0, capacity)
      const charactersHere = bodies.filter((body) => body.character)
      const refereesHere = bodies.filter((body) => body.referee && !body.character)
      const anonymousHere = bodies.filter((body) => !body.character && !body.referee)
      placeCrowdHeads(meshes, crowd, capacity)
      for (const body of charactersHere) {
        const character = characterFor(body.character!, characterPose(body))
        placeCharacter(character, body)
        character.figure.animate(seconds ?? 0, character.pose, {})
      }
      for (const body of refereesHere) {
        const character = characterFor('referee', characterPose(body))
        placeCharacter(character, body)
        character.figure.animate(seconds ?? 0, character.pose, {})
      }
      for (const body of anonymousHere) {
        const character = characterFor(`crowd:${body.id}`, characterPose(body))
        placeCharacter(character, body)
        character.figure.animate(seconds ?? 0, character.pose, {})
      }
    },
  }
}

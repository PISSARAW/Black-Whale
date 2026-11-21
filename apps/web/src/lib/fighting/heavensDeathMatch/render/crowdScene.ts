import type * as Three from 'three'
import type { SceneryKit } from '../../stageKit'
import { crowdInstances, type CrowdInstance } from '../crowd/lod'
import type { CrowdState } from '../crowd/types'

/** Clothes of the Heavens Arena crowd, the palette the drawn blocks used. */
export const CROWD_PALETTE = [0x6f5a4c, 0x8a6d5a, 0x4d5b70, 0x7a4040, 0x5d6b4a, 0x9a8a72, 0x3f4656]
const HAIR = [0x1d1a18, 0x3b2a1e, 0x6a4a2c, 0x8f8a80, 0x2a2420]
const SKIN = 0xc9a387
/** Chrollo's own head, worn by a spectator after Convert Hands. */
const CHROLLO_HEAD = 0x111015
const HEAD_RADIUS = 0.11

export interface CrowdScene {
  root: Three.Group
  /** Draws every body where the crowd simulation has it. */
  sync: (crowd: CrowdState) => void
}

type Pose = { centreY: number; height: number; lying: boolean; scale: number }

function poseOf(body: CrowdInstance): Pose {
  const height = body.height * 0.82
  switch (body.posture) {
    case 'seated':
      return { centreY: body.at.y + 0.32, height: height * 0.55, lying: false, scale: 1 }
    case 'injured':
    case 'dead':
      return { centreY: body.at.y + 0.14, height, lying: true, scale: 1 }
    case 'evacuated':
    case 'vanished':
      return { centreY: body.at.y, height, lying: false, scale: 0 }
    default:
      return { centreY: body.at.y + height / 2, height, lying: false, scale: 1 }
  }
}

interface Meshes {
  bodies: Three.InstancedMesh
  heads: Three.InstancedMesh
  placed: Three.Object3D
  colour: Three.Color
  skin: Three.Color
}

function place(meshes: Meshes, body: CrowdInstance, index: number): void {
  const { placed, colour } = meshes
  const pose = poseOf(body)
  placed.position.set(body.at.x, pose.centreY, body.at.z)
  placed.rotation.set(pose.lying ? Math.PI / 2 : 0, 0, 0)
  placed.scale.set(pose.scale, pose.height * pose.scale, pose.scale)
  placed.updateMatrix()
  meshes.bodies.setMatrixAt(index, placed.matrix)
  const dim = body.posture === 'dead' ? 0.45 : 1
  colour.setHex(CROWD_PALETTE[body.palette % CROWD_PALETTE.length]).multiplyScalar(0.42 * dim)
  meshes.bodies.setColorAt(index, colour)
  // The head sits on top of the body, or beyond its end when the body lies down.
  const reach = pose.height / 2 + HEAD_RADIUS
  placed.position.set(
    body.at.x,
    pose.lying ? pose.centreY : pose.centreY + reach,
    pose.lying ? body.at.z + reach : body.at.z,
  )
  placed.rotation.set(0, 0, 0)
  placed.scale.setScalar(pose.scale)
  placed.updateMatrix()
  meshes.heads.setMatrixAt(index, placed.matrix)
  colour.setHex(body.chrolloFace ? CHROLLO_HEAD : HAIR[index % HAIR.length])
  meshes.heads.setColorAt(index, colour.lerp(meshes.skin, 0.35 * dim))
}

/** Instanced bodies and heads, one pair per spectator, up to `capacity` (copies included). */
export function buildCrowdScene(kit: SceneryKit, capacity: number): CrowdScene {
  const { THREE, glow, geometry } = kit
  const root = new THREE.Group()
  const meshes: Meshes = {
    bodies: new THREE.InstancedMesh(
      geometry(new THREE.BoxGeometry(0.36, 1, 0.26)),
      glow(0xffffff, 1),
      capacity,
    ),
    heads: new THREE.InstancedMesh(
      geometry(new THREE.SphereGeometry(HEAD_RADIUS, 8, 6)),
      glow(0xffffff, 1),
      capacity,
    ),
    placed: new THREE.Object3D(),
    colour: new THREE.Color(),
    skin: new THREE.Color(SKIN),
  }
  root.add(meshes.bodies, meshes.heads)
  return {
    root,
    sync(crowd) {
      const bodies = crowdInstances(crowd).slice(0, capacity)
      bodies.forEach((body, index) => place(meshes, body, index))
      for (const mesh of [meshes.bodies, meshes.heads]) {
        mesh.count = bodies.length
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      }
    },
  }
}

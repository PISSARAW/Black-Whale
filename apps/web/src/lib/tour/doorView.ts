import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { createAnimatedDoor, type AnimatedDoor } from './doorAnimator'
import { computeDoorPlacement } from './doorDetailSurface'
import { buildTierDoorLeaves, dressTierDoorCasing } from './doorTierBuilders'
import { buildTserriednichDoorLeaves, dressTserriednichDoorCasing } from './tserriednichDoorStyle'
import { TSERRIEDNICH_ROOM_1004 } from './tserriednichRoomView'
import type { RoomDetailOptions } from './TierView'
import type { Doorway } from './types'

export interface DoorGroupWithAnimators extends Three.Group {
  animatedDoors?: AnimatedDoor[]
}

/** Resolves ship tier (1 to 5) from space ID or deck tier fallback. */
export function resolveTier(spaceId: string, tierIdFallback = 'tier-1'): 1 | 2 | 3 | 4 | 5 {
  const match = spaceId.match(/^tier-([1-5])/)
  if (match) return Number(match[1]) as 1 | 2 | 3 | 4 | 5
  const fallbackMatch = tierIdFallback.match(/^tier-([1-5])/)
  if (fallbackMatch) return Number(fallbackMatch[1]) as 1 | 2 | 3 | 4 | 5
  return 1
}

function bindSentinel(sentinel: Three.Object3D, animatedDoors: AnimatedDoor[]): void {
  let lastTime = 0
  sentinel.onBeforeRender = (_renderer, _scene, camera) => {
    const now = performance.now()
    const dt = lastTime > 0 ? Math.min(0.1, (now - lastTime) / 1000) : 0.016
    lastTime = now
    const cam = camera as Three.Camera
    for (const door of animatedDoors) {
      door.update({ x: cam.position.x, z: cam.position.z, y: cam.position.y }, dt)
    }
  }
}

/** Builds faithful 3D doors for any room with static casings and dynamic leaves. */
export function buildDoorDetails(options: RoomDetailOptions): DoorGroupWithAnimators | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null

  // Collect doorways associated with this space
  const doors = plan.doorways.filter((door: Doorway) => door.a === spaceId)
  if (doors.length === 0) return null

  const tier = resolveTier(spaceId, plan.tier.id)
  const isTserriednichRoom = spaceId.startsWith(TSERRIEDNICH_ROOM_1004)
  const casingBuilder = new BanquetDetailBuilder(THREE)
  const animatedDoors: AnimatedDoor[] = []

  for (const door of doors) {
    const placement = computeDoorPlacement(plan, door)
    if (isTserriednichRoom) {
      dressTserriednichDoorCasing({ into: casingBuilder, door, placement })
    } else {
      dressTierDoorCasing({ into: casingBuilder, door, placement }, tier)
    }
    const leaves = isTserriednichRoom
      ? buildTserriednichDoorLeaves({ THREE, placement })
      : buildTierDoorLeaves({ THREE, placement, tier })
    const animatedDoor = createAnimatedDoor({
      center: [placement.center[0], placement.center[1]],
      floor: placement.floor,
      height: placement.height,
      leaves,
    })
    animatedDoors.push(animatedDoor)
  }

  const casingGroup = casingBuilder.finish(`doors-casing-${spaceId}`)
  const rootGroup: DoorGroupWithAnimators = new THREE.Group()
  rootGroup.name = `doors-${spaceId}`

  // Ensure batched casing mesh is first child for efficient rendering & test compatibility
  for (const child of casingGroup.children) {
    rootGroup.add(child)
  }

  // Add animated hinge groups
  for (const door of animatedDoors) {
    for (const leaf of door.leaves) {
      rootGroup.add(leaf.hingeGroup)
    }
  }

  // Bind proximity animation on the sentinel mesh
  const sentinel = rootGroup.children[0]
  if (sentinel) {
    bindSentinel(sentinel, animatedDoors)
  }

  rootGroup.animatedDoors = animatedDoors
  return rootGroup
}

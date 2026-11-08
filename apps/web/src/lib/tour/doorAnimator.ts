import type * as Three from 'three'

export interface AnimatedDoorLeaf {
  hingeGroup: Three.Group
  baseRotationY: number
  maxSwing: number
}

export interface AnimatedDoorConfig {
  center: [number, number]
  floor: number
  height: number
  leaves: AnimatedDoorLeaf[]
}

export interface VisitorPosition {
  x: number
  z: number
  y?: number
}

export interface AnimatedDoor {
  center: [number, number]
  floor: number
  height: number
  leaves: AnimatedDoorLeaf[]
  openProgress: number
  targetProgress: number
  update(visitor: VisitorPosition, dt?: number): void
  setOpen(open: boolean): void
  toggle(): void
}

export const DOOR_OPEN_RADIUS = 2.4
export const DOOR_CLOSE_RADIUS = 3.2
export const DOOR_MAX_VERTICAL_GAP = 3.0
export const DOOR_SWING_RATE = 5.0

/** Creates an animated door controller managing leaf rotation and proximity open/close. */
export function createAnimatedDoor(config: AnimatedDoorConfig): AnimatedDoor {
  const { center, floor, height, leaves } = config
  let openProgress = 0
  let targetProgress = 0

  function applyLeaves(progress: number): void {
    for (const leaf of leaves) {
      leaf.hingeGroup.rotation.y = leaf.baseRotationY + leaf.maxSwing * progress
      leaf.hingeGroup.updateMatrixWorld(true)
    }
  }

  function resolveTarget(visitorX: number, visitorZ: number, visitorY?: number): number {
    const dx = visitorX - center[0]
    const dz = visitorZ - center[1]
    const distance = Math.hypot(dx, dz)

    if (visitorY !== undefined) {
      const midY = floor + height / 2
      if (Math.abs(visitorY - midY) > DOOR_MAX_VERTICAL_GAP) {
        return 0
      }
    }

    if (distance <= DOOR_OPEN_RADIUS) return 1
    if (distance >= DOOR_CLOSE_RADIUS) return 0
    return targetProgress
  }

  function update(visitor: VisitorPosition, dt = 0.016): void {
    targetProgress = resolveTarget(visitor.x, visitor.z, visitor.y)
    const delta = (targetProgress - openProgress) * Math.min(1.0, dt * DOOR_SWING_RATE)
    openProgress = Math.max(0, Math.min(1, openProgress + delta))
    applyLeaves(openProgress)
  }

  function setOpen(open: boolean): void {
    targetProgress = open ? 1 : 0
    openProgress = targetProgress
    applyLeaves(openProgress)
  }

  function toggle(): void {
    setOpen(targetProgress < 0.5)
  }

  // Initialise leaves in closed position
  applyLeaves(0)

  return {
    center,
    floor,
    height,
    leaves,
    get openProgress() {
      return openProgress
    },
    get targetProgress() {
      return targetProgress
    },
    update,
    setOpen,
    toggle,
  }
}

/** Attaches onBeforeRender hook to animate door leaves when in view of the active camera. */
export function bindDoorAnimation(sentinel: Three.Object3D, door: AnimatedDoor): void {
  let lastTime = 0

  sentinel.onBeforeRender = (_renderer, _scene, camera) => {
    const now = performance.now()
    const dt = lastTime > 0 ? Math.min(0.1, (now - lastTime) / 1000) : 0.016
    lastTime = now

    const cam = camera as Three.Camera
    door.update(cam.position.x, cam.position.z, cam.position.y, dt)
  }
}

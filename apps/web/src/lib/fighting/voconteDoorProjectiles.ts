import { doorFramesFor } from './voconteDoorSites'
import type { FightProjectile, FightSide, FightState } from './types'
import type { DoorFrame } from './voconteDoorTypes'

/** Opening height shared with bodies: the lintel stands 14 units above the floor. */
const DOOR_OPENING = 14
/** A shot leaves the exit frame on its far side, never inside the jambs. */
const DOOR_EXIT_CLEARANCE = 2

/**
 * Only real thrown matter travels through a frame. Emitted aura is not an object passing a
 * threshold, and a tethered shot (gum, remote punch) cannot leave its line through a door.
 */
function doorCarries(projectile: FightProjectile): boolean {
  return (
    projectile.matter === 'object' &&
    !projectile.gumFlight &&
    !projectile.remotePunch &&
    projectile.y >= 0 &&
    projectile.y + projectile.height <= DOOR_OPENING
  )
}

function sweptThreshold(from: { x: number }, to: { x: number }, frame: DoorFrame): boolean {
  const before = (from.x - frame.x) * frame.direction
  const after = (to.x - frame.x) * frame.direction
  return before <= 0 && after >= 0 && after > before
}

const SIDES: readonly FightSide[] = ['player', 'opponent']

/**
 * Deliberately free of the Hatsu graph (projectiles load before it): `advanceVoconteDoors`
 * runs earlier in the frame and already closes any network whose owner lost Door.
 */
function crossedOpenFrame(state: FightState, from: { x: number }, to: { x: number }) {
  for (const owner of SIDES) {
    if (!state.voconteDoors?.networks[owner]?.active) continue
    const frames = doorFramesFor(state, owner)
    const frame = frames.find((entry) => sweptThreshold(from, to, entry))
    if (frame) return { frame, exit: frames.find((entry) => entry.id === frame.destination)! }
  }
  return null
}

export interface DoorProjectileStep {
  projectile: FightProjectile
  /** Start of the segment still to test against the world: the exit frame after a transit. */
  previousX: number
}

/**
 * The shot keeps its speed and heading; only its position jumps from the entry frame to
 * the linked one. The world between the two frames (cover, crates, walls) is skipped.
 */
export function passProjectileThroughDoor(
  state: FightState,
  step: DoorProjectileStep,
): DoorProjectileStep {
  const { projectile, previousX } = step
  if (!state.voconteDoors || !doorCarries(projectile)) return step
  const crossing = crossedOpenFrame(state, { x: previousX }, projectile)
  if (!crossing) return step
  const heading = Math.sign(projectile.velocityX) || crossing.frame.direction
  const travelled = Math.abs(projectile.x - crossing.frame.x)
  const x = crossing.exit.x + heading * Math.max(DOOR_EXIT_CLEARANCE, travelled)
  return { projectile: { ...projectile, x }, previousX: crossing.exit.x }
}

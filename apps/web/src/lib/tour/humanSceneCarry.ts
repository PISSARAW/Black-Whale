import type { Object3D, Vector3 } from 'three'
import type { HumanPose } from './humanAnimation'
import { createHumanLocomotion } from './humanLocomotion'

export { createHumanLocomotion as createLocomotion }

type HumanLocomotion = ReturnType<typeof createHumanLocomotion>

/** The parts of a rendered apparition that its walk and its rebuilds touch. */
interface CarriedHuman {
  root: Object3D
  facing?: number
  flown?: Vector3
  positioned?: boolean
  humanAnimate?: unknown
  humanLocomotion?: HumanLocomotion
}

interface SteppedHuman extends CarriedHuman {
  at: readonly [number, number]
  y: number
  humanPose?: HumanPose
  humanHeading?: number
}

/** What a rebuilt apparition keeps from the one it replaces. */
export interface HumanCarry {
  facing?: number
  flown?: Vector3
  humanLocomotion?: HumanLocomotion
  position?: Vector3
  angle: number
}

export function preserve(held: CarriedHuman): HumanCarry {
  return {
    facing: held.facing,
    flown: held.flown,
    humanLocomotion: held.humanLocomotion,
    position: held.positioned ? held.root.position.clone() : undefined,
    angle: held.root.rotation.y,
  }
}

/** A rebuilt human keeps its walk controller, so an appearance change does not restart a step. */
export function restore(held: CarriedHuman, saved: unknown): void {
  const previous = saved as HumanCarry | undefined
  held.facing = previous?.facing
  held.flown = previous?.flown
  if (!held.humanAnimate || !previous?.humanLocomotion) return
  held.humanLocomotion = previous.humanLocomotion
  if (!previous.position) return
  held.root.position.copy(previous.position)
  held.root.rotation.y = previous.angle
  held.positioned = true
}

/**
 * Walks the rendered body toward the latest authoritative point. Without a
 * known heading the figure turns to face the camera.
 */
export function step(
  held: SteppedHuman,
  camera: { position: Vector3 },
  timing: { seconds: number; delta: number },
) {
  const heading =
    held.humanHeading ??
    held.facing ??
    Math.atan2(camera.position.x - held.root.position.x, camera.position.z - held.root.position.z)
  const locomotion = held.humanLocomotion?.(
    held.root,
    { at: held.at, y: held.y, pose: held.humanPose, heading },
    timing,
  )
  held.facing = held.root.rotation.y
  return locomotion
}

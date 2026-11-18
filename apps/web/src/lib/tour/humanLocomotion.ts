import type { Object3D } from 'three'
import type { HumanAnimationLayer, HumanPose } from './humanAnimation'
import { createHumanFootSupport, HUMAN_WALK_TRANSITION } from './humanFootSupport'
import { WALK_STRIDE_METRES, WALK_STRIDE_SECONDS } from './humanWalk'

const MAX_SPEED = 1.4
const ACCELERATION = 3
const TURN_SPEED = 2.4
const STATIONARY = new Set<HumanPose>([
  'seated',
  'reclined',
  'cross-legged',
  'fallen',
  'held',
  'flute',
])
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
const angle = (value: number) => Math.atan2(Math.sin(value), Math.cos(value))
interface Destination {
  at: readonly [number, number]
  y: number
  pose?: HumanPose
  heading?: number
}
interface Timing {
  seconds: number
  delta: number
}
interface Cycle {
  distance: number
  walking: boolean
  stoppingAt?: number
}

/** Owns the rendered walk: speed, heading, distance clock and world-space support. */
export function createHumanLocomotion() {
  let velocity = { x: 0, z: 0 }
  const cycle: Cycle = { distance: WALK_STRIDE_METRES / 4, walking: false }
  const plant = createHumanFootSupport()
  return (
    root: Object3D,
    destination: Destination,
    timing: Timing,
  ): {
    pose: HumanPose
    layer: HumanAnimationLayer
  } => {
    const movement = moveHuman(root, destination, { delta: timing.delta, velocity })
    velocity = movement.velocity
    advanceCycle(cycle, movement, timing.seconds)
    const rest = destination.pose === 'walk' ? 'idle' : (destination.pose ?? 'idle')
    const pose = cycle.walking ? 'walk' : rest
    return {
      pose,
      layer: {
        transitionKey: `tour:${pose}`,
        transitionSeconds: HUMAN_WALK_TRANSITION,
        strideClock: (cycle.distance / WALK_STRIDE_METRES) * WALK_STRIDE_SECONDS,
        afterMotion: (human) => plant(human, { ...cycle, seconds: timing.seconds }),
      },
    }
  }
}

function moveHuman(
  root: Object3D,
  destination: Destination,
  input: { delta: number; velocity: { x: number; z: number } },
) {
  const dt = clamp(input.delta, 0, 0.05)
  const dx = destination.at[0] - root.position.x,
    dz = destination.at[1] - root.position.z
  const gap = Math.hypot(dx, dz)
  const stationary = STATIONARY.has(destination.pose ?? 'idle')
  const travelling = gap > 0.008 && !stationary
  const heading = travelling ? Math.atan2(dx, dz) : (destination.heading ?? root.rotation.y)
  const turn = clamp(angle(heading - root.rotation.y), -TURN_SPEED * dt, TURN_SPEED * dt)
  root.rotation.y += turn
  const aligned = Math.max(0, Math.cos(angle(heading - root.rotation.y)))
  const desiredSpeed = travelling ? Math.min(MAX_SPEED, gap * 6) * aligned ** 4 : 0
  const velocity = accelerate(
    input.velocity,
    {
      x: (dx / Math.max(gap, 1e-6)) * desiredSpeed,
      z: (dz / Math.max(gap, 1e-6)) * desiredSpeed,
    },
    dt,
  )
  const travel = Math.hypot(velocity.x, velocity.z) * dt
  const step = Math.min(gap, travel)
  const fraction = travel > 1e-6 ? step / travel : 0
  root.position.x += velocity.x * dt * fraction
  root.position.z += velocity.z * dt * fraction
  root.position.y += (destination.y - root.position.y) * (1 - Math.exp(-dt * 14))
  return { velocity, step, turn, stationary, dt }
}

function advanceCycle(cycle: Cycle, movement: ReturnType<typeof moveHuman>, seconds: number): void {
  const { step, turn, stationary } = movement
  cycle.distance += step + (stationary ? 0 : Math.abs(turn) * 0.65)
  const nextWalking = finishStep(cycle, movement)
  if (cycle.walking && !nextWalking && !stationary) cycle.stoppingAt = seconds
  if (nextWalking || stationary) cycle.stoppingAt = undefined
  cycle.walking = nextWalking
}

function finishStep(cycle: Cycle, movement: ReturnType<typeof moveHuman>): boolean {
  const active =
    !movement.stationary && (movement.step > 0.0001 || Math.abs(movement.turn) > 0.0001)
  if (active) return true
  if (movement.stationary || !cycle.walking) return false
  const remainder = cycle.distance % (WALK_STRIDE_METRES / 2)
  if (remainder <= 0.001) return false
  cycle.distance += Math.min(WALK_STRIDE_METRES / 2 - remainder, movement.dt * 1.5)
  return true
}

/** Limit the velocity vector, so a target reversal cannot flip momentum in one frame. */
function accelerate(from: { x: number; z: number }, to: { x: number; z: number }, dt: number) {
  const dx = to.x - from.x,
    dz = to.z - from.z
  const blend = Math.min(1, (ACCELERATION * dt) / Math.max(1e-6, Math.hypot(dx, dz)))
  return { x: from.x + dx * blend, z: from.z + dz * blend }
}

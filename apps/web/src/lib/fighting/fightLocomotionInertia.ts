import { addPoses, NEUTRAL_POSE, type BodyPlan, type FightPose } from './fightPose'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import type { ArcadeFighter } from './types'

export interface InertiaTiming {
  frame: number
  seconds: number
  frozen: boolean
}

interface InertiaState {
  lastX: number
  lastSeconds: number
  lastFrame: number
  lastFacing: 1 | -1
  filteredSpeed: number
  lean: number
  leanVelocity: number
  cachedPose: FightPose
}

const MAX_RAW_SPEED = 35
const TELEPORT_THRESHOLD = 4
const LEAN_LIMIT = 0.09
const LEAN_EPSILON = 0.0015
const ELASTIC_KEYS = new Set(['stance', 'guard', 'walk:forward', 'walk:backward'])

/** Presentation-only horizontal inertia: start-up lag and braking settle on the ground. */
export function createLocomotionInertia() {
  const state: InertiaState = {
    lastX: 0,
    lastSeconds: 0,
    lastFrame: -1,
    lastFacing: 1,
    filteredSpeed: 0,
    lean: 0,
    leanVelocity: 0,
    cachedPose: NEUTRAL_POSE,
  }
  return (fighter: ArcadeFighter, timing: InertiaTiming): FightPose => {
    if (timing.frozen) return state.cachedPose
    const dx = fighter.x - state.lastX
    if (needsReset(state, { fighter, timing, dx })) {
      resetState(state, fighter, timing)
      return NEUTRAL_POSE
    }
    const dt = clamp(timing.seconds - state.lastSeconds, 1 / 240, 1 / 20)
    state.lastX = fighter.x
    state.lastSeconds = timing.seconds
    state.lastFrame = timing.frame
    if (!isLocomotionEligible(fighter)) {
      decayState(state, dt)
      state.cachedPose = NEUTRAL_POSE
      return NEUTRAL_POSE
    }
    state.cachedPose = stepSpring(state, fighter, { dx, dt })
    return state.cachedPose
  }
}

/** Layer grounded locomotion inertia onto stance, walk and guard plans without touching attacks. */
export function withLocomotionInertia(
  plan: BodyPlan | null,
  inertia?: FightPose,
): BodyPlan | null {
  if (!plan || !inertia || plan.attackFlow || !plan.plant) return plan
  if (!ELASTIC_KEYS.has(plan.key) || !hasPoseOffset(inertia)) return plan
  return { ...plan, pose: addPoses(plan.pose, inertia) }
}

/** Profile-driven walk posture accent so all forty fighters carry their own weight when moving. */
export function physicalWalkAccent(fighter: ArcadeFighter, advancing: boolean): FightPose {
  const physical = fightPhysicalProfile(fighter)
  const heaviness = clamp(1 / physical.resistance - 1, -0.2, 0.55)
  const agility = clamp(physical.step - 0.9, -0.25, 0.3)
  const forwardPitch = advancing ? heaviness * 0.07 - agility * 0.03 : -agility * 0.03
  const kneeSink = Math.max(0, heaviness) * 0.06
  return {
    body: [forwardPitch, 0, 0],
    chest: [forwardPitch * 0.6, 0, 0],
    head: [-forwardPitch * 0.5, 0, 0],
    leadHip: [-kneeSink, 0, 0],
    leadKnee: [kneeSink, 0, 0],
  }
}

function stepSpring(
  state: InertiaState,
  fighter: ArcadeFighter,
  step: { dx: number; dt: number },
): FightPose {
  const { dx, dt } = step
  const mass = massFactor(fighter)
  const rawSpeed = clamp((dx * fighter.facing) / dt, -MAX_RAW_SPEED, MAX_RAW_SPEED)
  const alpha = 1 - Math.exp((-dt * 12) / mass)
  state.filteredSpeed += (rawSpeed - state.filteredSpeed) * alpha
  const accel = rawSpeed - state.filteredSpeed
  const targetLean = clamp(-accel * 0.0042 * mass, -LEAN_LIMIT, LEAN_LIMIT)
  const stiffness = 190 / mass
  const damping = 2 * 0.86 * Math.sqrt(stiffness)
  const springAccel = (targetLean - state.lean) * stiffness - state.leanVelocity * damping
  state.leanVelocity += springAccel * dt
  state.lean = clamp(state.lean + state.leanVelocity * dt, -LEAN_LIMIT, LEAN_LIMIT)
  return inertiaPose(state.lean)
}

function inertiaPose(lean: number): FightPose {
  if (Math.abs(lean) < LEAN_EPSILON) return NEUTRAL_POSE
  const brake = Math.abs(lean)
  return {
    root: [0, -brake * 0.12, lean * 0.14],
    body: [lean * 0.65, 0, 0],
    chest: [lean * 0.55, 0, 0],
    head: [-lean * 0.45, 0, 0],
    leadHip: [-brake * 0.45, 0, 0],
    leadKnee: [brake * 0.45, 0, 0],
    rearHip: [-brake * 0.3, 0, 0],
    rearKnee: [brake * 0.35, 0, 0],
    leadShoulder: [lean * 0.35, 0, 0],
    rearShoulder: [lean * 0.25, 0, 0],
  }
}

const STANDING_LOCOMOTION_POSES = new Set(['idle', 'walk', 'guard'])

function needsReset(
  state: InertiaState,
  input: { fighter: ArcadeFighter; timing: InertiaTiming; dx: number },
): boolean {
  const { fighter, timing, dx } = input
  if (state.lastFrame < 0 || timing.frame < state.lastFrame) return true
  if (timing.seconds <= state.lastSeconds) return true
  return fighter.facing !== state.lastFacing || Math.abs(dx) > TELEPORT_THRESHOLD
}

function resetState(state: InertiaState, fighter: ArcadeFighter, timing: InertiaTiming): void {
  state.lastX = fighter.x
  state.lastSeconds = timing.seconds
  state.lastFrame = timing.frame
  state.lastFacing = fighter.facing
  state.filteredSpeed = 0
  state.lean = 0
  state.leanVelocity = 0
  state.cachedPose = NEUTRAL_POSE
}

function decayState(state: InertiaState, dt: number): void {
  const factor = Math.exp(-dt * 18)
  state.filteredSpeed *= factor
  state.lean *= factor
  state.leanVelocity *= factor
}

function isLocomotionEligible(fighter: ArcadeFighter): boolean {
  if (!STANDING_LOCOMOTION_POSES.has(fighter.pose)) return false
  if (fighter.y > 0 || fighter.attack || fighter.crouching) return false
  if (fighter.motion?.dash || fighter.hitStun > 0 || fighter.knockdownFrames > 0) return false
  return !fighter.hanzoProjection && !fighter.luiniPassage
}

function massFactor(fighter: ArcadeFighter): number {
  return clamp(1 / fightPhysicalProfile(fighter).resistance, 0.85, 1.35)
}

function hasPoseOffset(pose: FightPose): boolean {
  return Object.keys(pose).length > 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

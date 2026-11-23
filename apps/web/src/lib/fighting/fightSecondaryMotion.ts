import { addPoses, NEUTRAL_POSE, type BodyPlan, type FightPose } from './fightPose'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import type { ArcadeFighter } from './types'

export interface SecondaryTiming {
  frame: number
  seconds: number
  frozen: boolean
}

interface SpringAxis {
  value: number
  velocity: number
}

interface SecondaryState {
  lastX: number
  lastY: number
  lastVx: number
  lastVy: number
  lastSeconds: number
  lastFrame: number
  lastFacing: 1 | -1
  headPitch: SpringAxis
  wristPitch: SpringAxis
  shoulderBounce: SpringAxis
  cachedPose: FightPose
}

const TELEPORT_X = 4
const TELEPORT_Y = 6
const EPSILON = 0.0015
const MAX_HEAD = 0.11
const MAX_WRIST = 0.18
const MAX_SHOULDER = 0.05
const EXCLUDED_KEYS = new Set(['cover-ears', 'flute-performance', 'luini-occupied-passage'])

/**
 * Presentation-only spring follow-through on head, wrists and shoulders.
 * Reacts to horizontal/vertical accelerations (dash stops, jump takeoffs,
 * landings, knockback) while freezing on hitstop and preserving attack contacts.
 */
export function createSecondaryMotion() {
  const state = initialState()
  return (fighter: ArcadeFighter, timing: SecondaryTiming): FightPose => {
    if (timing.frozen) return state.cachedPose
    const dx = fighter.x - state.lastX
    const dy = fighter.y - state.lastY
    if (needsReset(state, { fighter, timing, dx, dy })) {
      resetState(state, fighter, timing)
      return NEUTRAL_POSE
    }
    const dt = clamp(timing.seconds - state.lastSeconds, 1 / 240, 1 / 20)
    const vx = clamp((dx * fighter.facing) / dt, -60, 60)
    const vy = clamp(dy / dt, -80, 80)
    const ax = clamp((vx - state.lastVx) / dt, -900, 900)
    const ay = clamp((vy - state.lastVy) / dt, -1400, 1400)
    updateKinematics(state, { fighter, timing, vx, vy })
    if (!isSecondaryEligible(fighter)) {
      dampAll(state, dt)
      state.cachedPose = NEUTRAL_POSE
      return NEUTRAL_POSE
    }
    state.cachedPose = advanceSprings(state, fighter, { ax, ay, dt })
    return state.cachedPose
  }
}

/** Layer secondary follow-through onto a plan without altering attack startup or active contacts. */
export function withSecondaryMotion(
  plan: BodyPlan | null,
  secondary?: FightPose,
): BodyPlan | null {
  if (!plan || !secondary || EXCLUDED_KEYS.has(plan.key)) return plan
  if (isAttackContactWindow(plan) || Object.keys(secondary).length === 0) return plan
  return { ...plan, pose: addPoses(plan.pose, secondary) }
}

function advanceSprings(
  state: SecondaryState,
  fighter: ArcadeFighter,
  step: { ax: number; ay: number; dt: number },
): FightPose {
  const { ax, ay, dt } = step
  const mass = clamp(1 / fightPhysicalProfile(fighter).resistance, 0.85, 1.35)
  // Forward surge (ax > 0) lags head back (-); landing (ay > 0) nods head forward (+).
  const headImpulse = (-ax * 0.00055 + ay * 0.00042) * mass
  const wristImpulse = (-ax * 0.00075 - ay * 0.00065) * mass
  const shoulderImpulse = ay * 0.00022 * mass

  state.headPitch.velocity += headImpulse
  state.wristPitch.velocity += wristImpulse
  state.shoulderBounce.velocity += shoulderImpulse

  stepSpring(state.headPitch, { stiffness: 240 / mass, dampingRatio: 0.72, dt })
  stepSpring(state.wristPitch, { stiffness: 300 / mass, dampingRatio: 0.68, dt })
  stepSpring(state.shoulderBounce, { stiffness: 260 / mass, dampingRatio: 0.78, dt })

  state.headPitch.value = clamp(state.headPitch.value, -MAX_HEAD, MAX_HEAD)
  state.wristPitch.value = clamp(state.wristPitch.value, -MAX_WRIST, MAX_WRIST)
  state.shoulderBounce.value = clamp(state.shoulderBounce.value, -MAX_SHOULDER, MAX_SHOULDER)
  return buildPose(state)
}

function stepSpring(
  axis: SpringAxis,
  params: { stiffness: number; dampingRatio: number; dt: number },
): void {
  const { stiffness, dampingRatio, dt } = params
  const damping = 2 * dampingRatio * Math.sqrt(stiffness)
  const accel = -axis.value * stiffness - axis.velocity * damping
  axis.velocity += accel * dt
  axis.value += axis.velocity * dt
}

function buildPose(state: SecondaryState): FightPose {
  const head = state.headPitch.value
  const wrist = state.wristPitch.value
  const shoulder = state.shoulderBounce.value
  if (Math.abs(head) < EPSILON && Math.abs(wrist) < EPSILON && Math.abs(shoulder) < EPSILON) {
    return NEUTRAL_POSE
  }
  const pose: FightPose = {}
  if (Math.abs(head) >= EPSILON) pose.head = [head, 0, 0]
  if (Math.abs(wrist) >= EPSILON) {
    pose.leadWrist = [wrist, 0, 0]
    pose.rearWrist = [wrist * 0.85, 0, 0]
  }
  if (Math.abs(shoulder) >= EPSILON) {
    pose.leadShoulder = [shoulder, 0, 0]
    pose.rearShoulder = [shoulder, 0, 0]
  }
  return pose
}

function isAttackContactWindow(plan: BodyPlan): boolean {
  const flow = plan.attackFlow
  if (!flow) return false
  return flow.frame < flow.startup + flow.active
}

function isSecondaryEligible(fighter: ArcadeFighter): boolean {
  if (fighter.pose === 'ko' || fighter.pose === 'down') return false
  if (fighter.melodyPerformance || fighter.hanzoProjection || fighter.luiniPassage) return false
  return fighter.health > 0
}

function needsReset(
  state: SecondaryState,
  input: { fighter: ArcadeFighter; timing: SecondaryTiming; dx: number; dy: number },
): boolean {
  const { fighter, timing, dx, dy } = input
  if (state.lastFrame < 0 || timing.frame < state.lastFrame) return true
  if (timing.seconds <= state.lastSeconds || fighter.facing !== state.lastFacing) return true
  return Math.abs(dx) > TELEPORT_X || Math.abs(dy) > TELEPORT_Y
}

function updateKinematics(
  state: SecondaryState,
  input: { fighter: ArcadeFighter; timing: SecondaryTiming; vx: number; vy: number },
): void {
  state.lastX = input.fighter.x
  state.lastY = input.fighter.y
  state.lastVx = input.vx
  state.lastVy = input.vy
  state.lastSeconds = input.timing.seconds
  state.lastFrame = input.timing.frame
}

function resetState(state: SecondaryState, fighter: ArcadeFighter, timing: SecondaryTiming): void {
  state.lastX = fighter.x
  state.lastY = fighter.y
  state.lastVx = 0
  state.lastVy = 0
  state.lastSeconds = timing.seconds
  state.lastFrame = timing.frame
  state.lastFacing = fighter.facing
  state.headPitch = { value: 0, velocity: 0 }
  state.wristPitch = { value: 0, velocity: 0 }
  state.shoulderBounce = { value: 0, velocity: 0 }
  state.cachedPose = NEUTRAL_POSE
}

function dampAll(state: SecondaryState, dt: number): void {
  const factor = Math.exp(-dt * 18)
  for (const axis of [state.headPitch, state.wristPitch, state.shoulderBounce]) {
    axis.value *= factor
    axis.velocity *= factor
  }
}

function initialState(): SecondaryState {
  return {
    lastX: 0,
    lastY: 0,
    lastVx: 0,
    lastVy: 0,
    lastSeconds: 0,
    lastFrame: -1,
    lastFacing: 1,
    headPitch: { value: 0, velocity: 0 },
    wristPitch: { value: 0, velocity: 0 },
    shoulderBounce: { value: 0, velocity: 0 },
    cachedPose: NEUTRAL_POSE,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

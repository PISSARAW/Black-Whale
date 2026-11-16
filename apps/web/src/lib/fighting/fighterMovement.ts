import { FIXED_STEP } from './frameData'
import { fighterDefinition } from './roster'
import type { ArcadeFighter, FightInput, FighterDash, FighterMotion } from './types'

/**
 * Ground and air movement of a controlled fighter: walk, double-tap dash and
 * backdash, prejump, a jump arc locked at take-off and a short landing.
 *
 * The jump rises slower than it falls (two gravities), which reads as weight
 * rather than float; the whole arc lasts about 38 frames for a 10-unit apex.
 */
export const JUMP_SPEED = 54
export const GRAVITY_RISE = 146
export const GRAVITY_FALL = 274
export const PREJUMP_FRAMES = 3
export const LANDING_FRAMES = 3
export const DASH_TAP_WINDOW = 14

const GROUND = 0
const MIN_X = 7
const MAX_X = 93
const WALK_SCALE = 28
const BACK_WALK_RATIO = 0.8
const JUMP_DRIFT_RATIO = 1.15
const FORWARD_DASH = { frames: 18, peak: 96 }
const BACK_DASH = { frames: 16, peak: 82 }
const APEX = (JUMP_SPEED * JUMP_SPEED) / (2 * GRAVITY_RISE)
const LANDING_SPEED = Math.sqrt(2 * GRAVITY_FALL * APEX)

export const STILL_MOTION: FighterMotion = {
  velocityX: 0,
  prejumpFrames: 0,
  jumpDirection: 0,
  landingFrames: 0,
  dash: null,
  heldDirection: 0,
  tapDirection: 0,
  tapWindow: 0,
}

export function motionOf(fighter: ArcadeFighter): FighterMotion {
  return fighter.motion ?? STILL_MOTION
}

function withMotion(fighter: ArcadeFighter, motion: Partial<FighterMotion>): ArcadeFighter {
  return { ...fighter, motion: { ...motionOf(fighter), ...motion } }
}

/** One frame of gravity, air drift and landing; runs for every fighter. */
export function advanceAirborne(
  fighter: ArcadeFighter,
): Pick<ArcadeFighter, 'x' | 'y' | 'velocityY' | 'motion'> {
  const motion = motionOf(fighter)
  const landingFrames = Math.max(0, motion.landingFrames - 1)
  if (fighter.y <= GROUND && fighter.velocityY <= 0) {
    return { x: fighter.x, y: GROUND, velocityY: 0, motion: { ...motion, landingFrames } }
  }
  const gravity = fighter.velocityY > 0 ? GRAVITY_RISE : GRAVITY_FALL
  const velocityY = fighter.velocityY - gravity * FIXED_STEP
  const y = Math.max(GROUND, fighter.y + velocityY * FIXED_STEP)
  const drift = fighter.hitStun > 0 ? 0 : motion.velocityX
  const x = clamp(fighter.x + drift * FIXED_STEP, MIN_X, MAX_X)
  if (y > GROUND) return { x, y, velocityY, motion: { ...motion, velocityX: drift, landingFrames } }
  const landed = { ...motion, velocityX: 0, landingFrames: LANDING_FRAMES }
  return { x, y, velocityY: 0, motion: landed }
}

export interface SteerOptions {
  input: FightInput
  mobile: boolean
  jumpable: boolean
}

/** Turns held directions into walk, dash or jump for a fighter free to move. */
export function steerFighter(fighter: ArcadeFighter, options: SteerOptions): ArcadeFighter {
  const direction = inputDirection(options.input)
  const { fighter: tracked, dash } = trackTaps(fighter, direction)
  const motion = motionOf(tracked)
  if (!options.mobile) return withMotion(tracked, { dash: null, prejumpFrames: 0 })
  if (motion.prejumpFrames > 0) return advancePrejump(tracked)
  if (options.jumpable && motion.landingFrames === 0) return beginPrejump(tracked, direction)
  if (motion.dash) return advanceDash(tracked, motion.dash)
  if (canDash(tracked, dash)) return advanceDash(tracked, startDash(tracked, dash))
  if (tracked.y > GROUND || tracked.blocking) return tracked
  if (motion.landingFrames > 0) return { ...tracked, pose: 'idle' }
  return walk(tracked, direction)
}

function inputDirection(input: FightInput): -1 | 0 | 1 {
  return (Number(input.right) - Number(input.left)) as -1 | 0 | 1
}

function trackTaps(
  fighter: ArcadeFighter,
  direction: -1 | 0 | 1,
): { fighter: ArcadeFighter; dash: -1 | 0 | 1 } {
  const motion = motionOf(fighter)
  const tapWindow = Math.max(0, motion.tapWindow - 1)
  const pressed = direction !== 0 && direction !== motion.heldDirection
  if (!pressed) {
    return { fighter: withMotion(fighter, { heldDirection: direction, tapWindow }), dash: 0 }
  }
  const doubled = motion.tapDirection === direction && tapWindow > 0
  const next = doubled
    ? { heldDirection: direction, tapDirection: 0 as const, tapWindow: 0 }
    : { heldDirection: direction, tapDirection: direction, tapWindow: DASH_TAP_WINDOW }
  return { fighter: withMotion(fighter, next), dash: doubled ? direction : 0 }
}

function canDash(fighter: ArcadeFighter, dash: -1 | 0 | 1): dash is -1 | 1 {
  const motion = motionOf(fighter)
  return dash !== 0 && fighter.y === GROUND && !fighter.blocking && motion.landingFrames === 0
}

function startDash(fighter: ArcadeFighter, direction: -1 | 1): FighterDash {
  const profile = direction === fighter.facing ? FORWARD_DASH : BACK_DASH
  return { direction, frame: 0, ...profile }
}

function advanceDash(fighter: ArcadeFighter, dash: FighterDash): ArcadeFighter {
  const remaining = 1 - dash.frame / dash.frames
  const x = clamp(fighter.x + dash.direction * dash.peak * remaining * FIXED_STEP, MIN_X, MAX_X)
  const frame = dash.frame + 1
  const next = frame >= dash.frames ? null : { ...dash, frame }
  return withMotion({ ...fighter, x, pose: 'walk' }, { dash: next })
}

function beginPrejump(fighter: ArcadeFighter, direction: -1 | 0 | 1): ArcadeFighter {
  const started = withMotion(
    { ...fighter, blocking: false, pose: 'idle' },
    { prejumpFrames: PREJUMP_FRAMES, jumpDirection: direction, dash: null },
  )
  return advancePrejump(started)
}

function advancePrejump(fighter: ArcadeFighter): ArcadeFighter {
  const motion = motionOf(fighter)
  const prejumpFrames = motion.prejumpFrames - 1
  if (prejumpFrames > 0) return withMotion({ ...fighter, blocking: false }, { prejumpFrames })
  const velocityX = motion.jumpDirection * walkSpeed(fighter) * JUMP_DRIFT_RATIO
  return withMotion(
    { ...fighter, velocityY: JUMP_SPEED, pose: 'jump', blocking: false },
    { prejumpFrames: 0, velocityX },
  )
}

function walk(fighter: ArcadeFighter, direction: -1 | 0 | 1): ArcadeFighter {
  const backward = direction !== 0 && direction !== fighter.facing
  const speed = walkSpeed(fighter) * (backward ? BACK_WALK_RATIO : 1)
  const x = clamp(fighter.x + direction * speed * FIXED_STEP, MIN_X, MAX_X)
  return { ...fighter, x, pose: direction === 0 ? 'idle' : 'walk' }
}

function walkSpeed(fighter: ArcadeFighter): number {
  return fighterDefinition(fighter.id).speed * WALK_SCALE
}

/** 0 at take-off, 0.5 at the apex, 1 on landing — drives the jump pose. */
export function jumpProgress(fighter: ArcadeFighter): number {
  if (fighter.velocityY >= 0) return clamp((1 - fighter.velocityY / JUMP_SPEED) / 2, 0, 0.5)
  return clamp(0.5 + -fighter.velocityY / LANDING_SPEED / 2, 0.5, 1)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

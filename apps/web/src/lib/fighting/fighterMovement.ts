import { phinksLowDodge } from './phinksLowDodge'
import { styleMobility } from './styleMobility'
import { physicalCombatProfile } from './physicalCombatProfiles'
import { crossingDash } from './signatureCrossing'
import {
  advanceSway,
  enReflexBackdashBoost,
  jumpLaunchSpeed,
  legRyuBoost,
  prejumpDuration,
  shouldBrakeDash,
  walkPaceFactor,
} from './movementTech'
import { assassinLowSlide, bonolenovPrologueDash, fallGravityFor } from './characterMovementTech'
import {
  applyKoFastDrop,
  jumpArcMultipliers,
  nextDownTapWindow,
  runSpeedFactor,
  tryWallJump,
} from './advancedMovementTech'
import { hanzoReverseDash } from './defensiveMovementTech'
import { FIXED_STEP } from './fightClock'
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
const JUMP_DRIFT_RATIO = 1.15
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

export function pursuitTakeoff(fighter: ArcadeFighter) {
  return {
    y: 0.15,
    velocityY: 47,
    motion: {
      ...motionOf(fighter),
      velocityX: fighter.facing * 35,
      prejumpFrames: 0,
      landingFrames: 0,
      dash: null,
    },
  }
}

function withMotion(fighter: ArcadeFighter, motion: Partial<FighterMotion>): ArcadeFighter {
  return { ...fighter, motion: { ...motionOf(fighter), ...motion } }
}

/** One frame of gravity, air drift and landing; runs for every fighter. */
export function advanceAirborne(
  fighter: ArcadeFighter,
): Pick<ArcadeFighter, 'x' | 'y' | 'velocityY' | 'motion'> {
  if (fighter.hanzoProjection)
    return { x: fighter.x, y: fighter.y, velocityY: 0, motion: undefined }
  const motion = motionOf(fighter)
  const landingFrames = Math.max(0, motion.landingFrames - 1)
  if (fighter.y <= GROUND && fighter.velocityY <= 0) {
    return { x: fighter.x, y: GROUND, velocityY: 0, motion: { ...motion, landingFrames } }
  }
  const gravity = fighter.velocityY > 0 ? GRAVITY_RISE : fallGravityFor(fighter, GRAVITY_FALL)
  const velocityY = fighter.velocityY - gravity * FIXED_STEP
  const y = Math.max(GROUND, fighter.y + velocityY * FIXED_STEP)
  const drift = fighter.hitStun > 0 ? 0 : motion.velocityX
  const x = clamp(fighter.x + drift * FIXED_STEP, MIN_X, MAX_X)
  if (y > GROUND) return { x, y, velocityY, motion: { ...motion, velocityX: drift, landingFrames } }
  const landed = {
    ...motion,
    velocityX: 0,
    landingFrames: landingDuration(fighter),
    wallJumped: undefined,
    superJump: undefined,
    dashJump: undefined,
  }
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
  const { fighter: tapped, dash } = trackTaps(fighter, direction)
  const tracked = trackGroundWindow(
    advanceSway(tapped, options.input, options.mobile),
    options.input,
  )
  const motion = motionOf(tracked)
  if (!options.mobile)
    return withMotion(tracked, { dash: null, prejumpFrames: 0, running: undefined })
  if (motion.prejumpFrames > 0) return advancePrejump(tracked, options.input.jump)
  if (options.jumpable && motion.landingFrames === 0) return beginPrejump(tracked, direction)
  if (motion.dash) return stepActiveDash(tracked, motion.dash, options)
  if (canDash(tracked, dash)) return advanceDash(tracked, startDash(tracked, dash), direction)
  if (tracked.y > GROUND) return steerAirborne(tracked, options.input)
  if (tracked.blocking) return withMotion(tracked, { running: undefined })
  if (motion.landingFrames > 0) return { ...tracked, pose: 'idle' }
  return walk(tracked, direction)
}

function trackGroundWindow(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const motion = motionOf(fighter)
  const downTapWindow = nextDownTapWindow(motion, input, fighter.y === GROUND)
  return downTapWindow === (motion.downTapWindow ?? 0)
    ? fighter
    : withMotion(fighter, { downTapWindow })
}

function steerAirborne(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const kicked = tryWallJump(fighter, motionOf(fighter), input)
  return kicked ?? applyKoFastDrop(fighter, input)
}

function stepActiveDash(
  fighter: ArcadeFighter,
  dash: FighterDash,
  options: SteerOptions,
): ArcadeFighter {
  const direction = inputDirection(options.input)
  if (shouldBrakeDash({ fighter, dash, direction, input: options.input })) {
    const reverse = hanzoReverseDash(fighter, dash.direction, direction)
    if (reverse) return advanceDash(fighter, reverse, direction)
    const braked = withMotion(fighter, { dash: null, running: undefined })
    return braked.blocking || braked.crouching
      ? { ...braked, pose: 'idle' }
      : walk(braked, direction)
  }
  return advanceDash(fighter, dash, direction)
}

function inputDirection(input: FightInput): -1 | 0 | 1 {
  return (Number(input.right) - Number(input.left)) as -1 | 0 | 1
}

/** The direction a double tap completes on this frame's input, without consuming it. */
export function doubleTapDirection(fighter: ArcadeFighter, input: FightInput): -1 | 0 | 1 {
  return trackTaps(fighter, inputDirection(input)).dash
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
  const mobility = styleMobility(fighter)
  const forward = direction === fighter.facing
  const lowProfile = phinksLowDodge(fighter, direction) ?? assassinLowSlide(fighter, direction)
  const baseProfile = lowProfile ?? (forward ? mobility.forwardDash : mobility.backDash)
  const styled = lowProfile ? baseProfile : bonolenovPrologueDash(fighter, baseProfile)
  const boost = forward ? legRyuBoost(fighter) : enReflexBackdashBoost(fighter, direction)
  return {
    direction,
    frame: 0,
    ...styled,
    peak: styled.peak * boost,
    ...crossingDash(fighter, direction),
  }
}

function advanceDash(
  fighter: ArcadeFighter,
  dash: FighterDash,
  heldDirection: -1 | 0 | 1,
): ArcadeFighter {
  const remaining = 1 - dash.frame / dash.frames
  const x = clamp(fighter.x + dash.direction * dash.peak * remaining * FIXED_STEP, MIN_X, MAX_X)
  const frame = dash.frame + 1
  const finished = frame >= dash.frames
  const keepRunning =
    finished &&
    !dash.lowDodge &&
    dash.direction === fighter.facing &&
    heldDirection === fighter.facing
  return withMotion(
    { ...fighter, x, pose: 'walk' },
    { dash: finished ? null : { ...dash, frame }, running: keepRunning ? true : undefined },
  )
}

function beginPrejump(fighter: ArcadeFighter, direction: -1 | 0 | 1): ArcadeFighter {
  const motion = motionOf(fighter)
  const superJump = (motion.downTapWindow ?? 0) > 0
  const dashJump = Boolean(motion.dash && motion.dash.direction === fighter.facing)
  const started = withMotion(
    { ...fighter, blocking: false, pose: 'idle' },
    {
      prejumpFrames: prejumpDuration(fighter, PREJUMP_FRAMES),
      jumpDirection: direction,
      dash: null,
      running: undefined,
      superJump: superJump || undefined,
      dashJump: dashJump || undefined,
    },
  )
  return advancePrejump(started, true)
}

function advancePrejump(fighter: ArcadeFighter, holdingJump: boolean): ArcadeFighter {
  const motion = motionOf(fighter)
  const prejumpFrames = motion.prejumpFrames - 1
  if (prejumpFrames > 0) return withMotion({ ...fighter, blocking: false }, { prejumpFrames })
  const arc = jumpArcMultipliers(fighter, motion, holdingJump)
  const profile = physicalCombatProfile(fighter.id)
  const velocityX =
    motion.jumpDirection * walkSpeed(fighter) * JUMP_DRIFT_RATIO * arc.vx * (profile?.drift ?? 1)
  return withMotion(
    {
      ...fighter,
      velocityY: jumpLaunchSpeed(fighter, JUMP_SPEED * (profile?.jump ?? 1), holdingJump) * arc.vy,
      pose: 'jump',
      blocking: false,
    },
    { prejumpFrames: 0, velocityX, superJump: undefined, dashJump: undefined },
  )
}

function walk(fighter: ArcadeFighter, direction: -1 | 0 | 1): ArcadeFighter {
  const motion = motionOf(fighter)
  const running = motion.running && direction === fighter.facing
  const backward = direction !== 0 && direction !== fighter.facing
  const pace = backward
    ? styleMobility(fighter).backWalk
    : walkPaceFactor(fighter, direction) * runSpeedFactor(fighter, motion, direction)
  const speed = walkSpeed(fighter) * pace
  const x = clamp(fighter.x + direction * speed * FIXED_STEP, MIN_X, MAX_X)
  const moved: ArcadeFighter = { ...fighter, x, pose: direction === 0 ? 'idle' : 'walk' }
  return motion.running && !running ? withMotion(moved, { running: undefined }) : moved
}

export function walkSpeed(fighter: ArcadeFighter): number {
  return fighterDefinition(fighter.id).speed * WALK_SCALE * styleMobility(fighter).walkScale
}

export function landingDuration(fighter: ArcadeFighter): number {
  return physicalCombatProfile(fighter.id)?.landing ?? LANDING_FRAMES
}

/** 0 at take-off, 0.5 at the apex, 1 on landing — drives the jump pose. */
export function jumpProgress(fighter: ArcadeFighter): number {
  const jump = physicalCombatProfile(fighter.id)?.jump ?? 1
  if (fighter.velocityY >= 0)
    return clamp((1 - fighter.velocityY / (JUMP_SPEED * jump)) / 2, 0, 0.5)
  return clamp(0.5 + -fighter.velocityY / (LANDING_SPEED * jump) / 2, 0.5, 1)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

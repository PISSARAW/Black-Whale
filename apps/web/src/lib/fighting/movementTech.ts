import { bodyLegFactor } from './bodyDamage'
import { dashBrakeMinFrame } from './advancedMovementTech'
import { shouldBrakeBackdash, swayCooldownFor } from './defensiveMovementTech'
import type { ArcadeFighter, FightInput, FighterDash } from './types'

declare module './types' {
  interface FighterDash {
    /** Low crouched advance (Phinks low dodge, assassin low slide); down alone does not brake it. */
    lowDodge?: true
  }

  interface ArcadeFighter {
    /** Active frames of a torso pullback sway; upper hurtbox shifts back while legs stay exposed. */
    swayFrames?: number
    /** Cooldown frames before another back sway can start. */
    swayCooldown?: number
  }
}

export const DASH_BRAKE_MIN_FRAME = 6
export const SHORT_HOP_RATIO = 0.68
export const SWAY_FRAMES = 10
export const SWAY_COOLDOWN = 16
export const SWAY_UPPER_SHIFT = 1.4
export const PARRY_STEP_FACTOR = 1.35
export const LEG_RYU_BOOST = 1.15
export const EN_REFLEX_BACKDASH_BOOST = 1.12

/**
 * Dash Brake: after the initial push beat, a forward dash can be stopped cleanly by pulling
 * back, guarding, or crouching (unless it is already a crouched low dodge).
 */
export function shouldBrakeDash(options: {
  fighter: ArcadeFighter
  dash: FighterDash
  direction: -1 | 0 | 1
  input: FightInput
}): boolean {
  const { fighter, dash, direction, input } = options
  if (shouldBrakeBackdash(fighter, dash, input)) return true
  if (dash.direction !== fighter.facing || dash.frame < dashBrakeMinFrame(fighter, DASH_BRAKE_MIN_FRAME))
    return false
  if (direction === -fighter.facing || input.guard) return true
  return !dash.lowDodge && input.down
}

/**
 * Short Hop + Leg-Ryu boost: releasing jump during the prejump squat produces a lower arc;
 * concentrating Ryu/Gyo into the feet (>= 70%) boosts take-off when legs are healthy.
 */
export function jumpLaunchSpeed(
  fighter: ArcadeFighter,
  baseSpeed: number,
  holdingJump: boolean,
): number {
  const heightRatio = holdingJump ? 1 : SHORT_HOP_RATIO
  return baseSpeed * heightRatio * bodyLegFactor(fighter) * legRyuBoost(fighter)
}

/**
 * Leg-Ryu Burst Step: concentrating >= 70% aura in the feet (Ryu or corporeal Gyo)
 * grants a modest burst on take-off and forward dash, while leaving upper zones exposed.
 */
export function legRyuBoost(fighter: ArcadeFighter): number {
  if (fighter.nen.mode === 'zetsu' || bodyLegFactor(fighter) < 1) return 1
  return (fighter.nen.ryu.feet ?? 0) >= 0.7 ? LEG_RYU_BOOST : 1
}

/** En Reflex Step: an active En threat skips the prejump squat for immediate take-off. */
export function prejumpDuration(fighter: ArcadeFighter, baseFrames: number): number {
  return fighter.enReflexActive ? 1 : baseFrames
}

/** En Reflex Step: retreating under an active En alert accelerates the backdash burst. */
export function enReflexBackdashBoost(fighter: ArcadeFighter, direction: -1 | 1): number {
  return fighter.enReflexActive && direction !== fighter.facing ? EN_REFLEX_BACKDASH_BOOST : 1
}

/** Parry Advancing Step: closing in during the post-guard/parry Ryu window is brisker. */
export function walkPaceFactor(fighter: ArcadeFighter, direction: -1 | 0 | 1): number {
  if (direction === fighter.facing && fighter.ryuWindow > 0) return PARRY_STEP_FACTOR
  return 1
}

/**
 * Back Sway: a fresh back+guard press pulls the torso back for SWAY_FRAMES to whiff-punish
 * high pokes, without granting invulnerability or protecting the legs.
 */
export function advanceSway(
  fighter: ArcadeFighter,
  input: FightInput,
  mobile: boolean,
): ArcadeFighter {
  const swayFrames = Math.max(0, (fighter.swayFrames ?? 0) - 1)
  const swayCooldown = Math.max(0, (fighter.swayCooldown ?? 0) - 1)
  if (!mobile || fighter.y > 0) return setSway(fighter, 0, swayCooldown)
  if (swayFrames === 0 && swayCooldown === 0 && shouldTriggerSway(fighter, input)) {
    return setSway(fighter, SWAY_FRAMES, swayCooldownFor(fighter, SWAY_COOLDOWN))
  }
  return setSway(fighter, swayFrames, swayCooldown)
}

function shouldTriggerSway(fighter: ArcadeFighter, input: FightInput): boolean {
  const direction = Number(input.right) - Number(input.left)
  return fighter.guardFrames === 1 && direction === -fighter.facing && !input.down && !input.aura
}

/** Horizontal pullback applied to the upper hurtbox during an active Back Sway. */
export function swayUpperShift(fighter: ArcadeFighter): number {
  return (fighter.swayFrames ?? 0) > 0 ? SWAY_UPPER_SHIFT : 0
}

function setSway(
  fighter: ArcadeFighter,
  swayFrames: number,
  swayCooldown: number,
): ArcadeFighter {
  if (!swayFrames && !swayCooldown && !fighter.swayFrames && !fighter.swayCooldown) return fighter
  return {
    ...fighter,
    swayFrames: swayFrames || undefined,
    swayCooldown: swayCooldown || undefined,
  }
}

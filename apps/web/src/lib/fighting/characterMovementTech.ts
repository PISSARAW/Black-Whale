import type { ArcadeFighter, FighterId } from './types'

const ASSASSIN_SLIDE_IDS: ReadonlySet<FighterId> = new Set([
  'feitan',
  'hanzo',
  'machi',
  'kalluto',
  'illumi',
])

export const ASSASSIN_LOW_SLIDE = { frames: 11, peak: 64, lowDodge: true as const }
export const KALLUTO_FALL_FACTOR = 0.7
export const BONOLENOV_PROLOGUE_DASH_FACTOR = 1.15
export const BISCUIT_TRUE_FORM_GUARD_KNOCKBACK = 0.75
export const WALL_REBOUND_MARGIN = 11
export const WALL_REBOUND_PEAK_FACTOR = 1.25
export const WALL_REBOUND_VELOCITY_Y = 28

/**
 * Assassins' Low Slide: holding down while double-tapping forward lets Feitan, Hanzo, Machi,
 * Kalluto and Illumi slip forward crouched under high strikes (same martial principle as Phinks).
 */
export function assassinLowSlide(
  fighter: ArcadeFighter,
  direction: -1 | 1,
): { frames: number; peak: number; lowDodge: true } | null {
  if (!ASSASSIN_SLIDE_IDS.has(fighter.id)) return null
  return fighter.crouching && direction === fighter.facing ? ASSASSIN_LOW_SLIDE : null
}

/**
 * Kalluto Paper Wind Float: while descending with aura available and out of hitstun,
 * Kalluto's paper-fan updraft softens the fall gravity by 30%.
 */
export function fallGravityFor(fighter: ArcadeFighter, baseFallGravity: number): number {
  const floating =
    fighter.id === 'kalluto' &&
    fighter.nen.mode !== 'zetsu' &&
    fighter.aura >= 5 &&
    fighter.hitStun === 0
  return floating ? baseFallGravity * KALLUTO_FALL_FACTOR : baseFallGravity
}

/**
 * Bonolenov Prologue Spin Step: while Battle Cantabile's Prologue is active, Bonolenov's
 * Gyudondond dance accelerates his dashes into crisp spinning steps.
 */
export function bonolenovPrologueDash(
  fighter: ArcadeFighter,
  base: { frames: number; peak: number },
): { frames: number; peak: number } {
  if (fighter.id !== 'bonolenov' || !fighter.battleCantabile?.prologue) return base
  return {
    frames: Math.max(12, base.frames - 2),
    peak: base.peak * BONOLENOV_PROLOGUE_DASH_FACTOR,
  }
}

/**
 * Hisoka Rubber Foot Wall Rebound: triggering the elastic foot spring with his back to
 * the corner wall rebounds him diagonally out of the corner.
 */
export function isWallReboundPosition(fighter: ArcadeFighter): boolean {
  return (
    (fighter.x <= WALL_REBOUND_MARGIN && fighter.facing === 1) ||
    (fighter.x >= 100 - WALL_REBOUND_MARGIN && fighter.facing === -1)
  )
}

/**
 * Biscuit (True Form) Grounded Step: her natural massive frame absorbs 25% of guard pushback
 * while standing on the ground.
 */
export function guardKnockbackFactor(defender: ArcadeFighter, blocked: boolean): number {
  if (!blocked || defender.y > 0) return 1
  return defender.id === 'biscuit' && defender.biscuitTrueForm
    ? BISCUIT_TRUE_FORM_GUARD_KNOCKBACK
    : 1
}

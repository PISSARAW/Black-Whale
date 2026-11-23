import { bodyLegFactor } from './bodyDamage'
import { canMove } from './fightActorState'
import { otherSide } from './frameData'
import { machiSourceActive } from './machiThread'
import { styleMatchup } from './styleMatchups'
import type { ArcadeFighter, FightInput, FightSide, FightState, FighterMotion } from './types'

declare module './types' {
  interface FighterMotion {
    /** Frames remaining after pressing Down where Up triggers a Super Jump. */
    downTapWindow?: number
    /** Current jump is a high-arc Super Jump (Down -> Up). */
    superJump?: boolean
    /** Current jump inherited forward dash momentum. */
    dashJump?: boolean
    /** One wall jump allowed per airborne arc. */
    wallJumped?: boolean
    /** Forward dash transitioned into a sustained Run while holding forward. */
    running?: boolean
  }
}

export const SUPER_JUMP_WINDOW = 8
export const SUPER_JUMP_VY_RATIO = 1.2
export const SUPER_JUMP_VX_RATIO = 1.15
export const DASH_JUMP_VX_RATIO = 1.25
export const RUN_SPEED_FACTOR = 1.25
export const WALL_JUMP_MIN_Y = 4
export const WALL_JUMP_MARGIN = 9
export const WALL_JUMP_VY = 44
export const WALL_JUMP_VX = 28
export const KO_FAST_DROP_SPEED = 78
export const ZETSU_STEALTH_DELAY = 6
export const CHROLLO_CLOSED_BOOK_FACTOR = 1.08
export const FEITAN_DASH_BRAKE_FRAME = 4
export const SAIYU_STAFF_VAULT_VY = 1.12
export const SAIYU_STAFF_VAULT_VX = 1.18
export const MACHI_THREAD_PULL_COST = 6
export const MACHI_THREAD_PULL_MIN_GAP = 8
export const MACHI_THREAD_PULL_DASH = { frames: 14, peak: 112 } as const

/** Refreshes the Down -> Up Super Jump window while grounded. */
export function nextDownTapWindow(
  motion: FighterMotion,
  input: FightInput,
  grounded: boolean,
): number {
  if (!grounded) return 0
  if (input.down) return SUPER_JUMP_WINDOW
  return Math.max(0, (motion.downTapWindow ?? 0) - 1)
}

/** Combined vertical/horizontal multipliers for Super Jump, Dash Jump, and Saiyu's Staff Vault. */
export function jumpArcMultipliers(
  fighter: ArcadeFighter,
  motion: FighterMotion,
  holdingJump: boolean,
): { vy: number; vx: number } {
  const superBoost = holdingJump && motion.superJump
  const dashBoost = motion.dashJump && motion.jumpDirection === fighter.facing
  const staff = staffVaultBoost(fighter, motion.jumpDirection)
  return {
    vy: (superBoost ? SUPER_JUMP_VY_RATIO : 1) * staff.vy,
    vx:
      (superBoost ? SUPER_JUMP_VX_RATIO : 1) *
      (dashBoost ? DASH_JUMP_VX_RATIO : 1) *
      staff.vx,
  }
}

/** Saiyu Staff Vault: forward jump gains extra lift and carry while holding his staff. */
export function staffVaultBoost(
  fighter: ArcadeFighter,
  jumpDirection: -1 | 0 | 1,
): { vy: number; vx: number } {
  if (fighter.id !== 'saiyu' || fighter.weaponsConfiscated || jumpDirection !== fighter.facing) {
    return { vy: 1, vx: 1 }
  }
  return { vy: SAIYU_STAFF_VAULT_VY, vx: SAIYU_STAFF_VAULT_VX }
}

/** Wall Jump: agile (`mobile`) fighters may kick off a corner wall once per airborne arc. */
export function tryWallJump(
  fighter: ArcadeFighter,
  motion: FighterMotion,
  input: FightInput,
): ArcadeFighter | null {
  if (!canWallJump(fighter, motion, input)) return null
  const away: -1 | 1 = fighter.x <= WALL_JUMP_MARGIN ? 1 : -1
  return {
    ...fighter,
    velocityY: WALL_JUMP_VY * bodyLegFactor(fighter),
    pose: 'jump',
    blocking: false,
    motion: { ...motion, velocityX: away * WALL_JUMP_VX, wallJumped: true },
  }
}

const AGILE_WALL_JUMPERS: ReadonlySet<import('./types').FighterId> = new Set([
  'feitan',
  'hanzo',
  'hisoka',
  'chrollo',
  'machi',
  'kalluto',
  'saiyu',
])

function canWallJump(
  fighter: ArcadeFighter,
  motion: FighterMotion,
  input: FightInput,
): boolean {
  if (!input.jump || fighter.y < WALL_JUMP_MIN_Y || motion.wallJumped) return false
  if (styleMatchup(fighter.id).role !== 'mobile' && !AGILE_WALL_JUMPERS.has(fighter.id))
    return false
  const atLeft = fighter.x <= WALL_JUMP_MARGIN && input.right
  const atRight = fighter.x >= 100 - WALL_JUMP_MARGIN && input.left
  return atLeft || atRight
}

/** Ko Fast Drop: holding Down in mid-air with Ko focused in the feet drops rapidly. */
export function applyKoFastDrop(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const drop =
    fighter.y > 0 &&
    fighter.hitStun === 0 &&
    input.down &&
    fighter.nen.ko === 'feet'
  if (!drop) return fighter
  return { ...fighter, velocityY: Math.min(fighter.velocityY, -KO_FAST_DROP_SPEED) }
}

/** Sustained Run speed factor when holding forward out of a completed forward dash. */
export function runSpeedFactor(
  fighter: ArcadeFighter,
  motion: FighterMotion,
  direction: -1 | 0 | 1,
): number {
  return motion.running && direction === fighter.facing ? RUN_SPEED_FACTOR : 1
}

/** Chrollo Free-Hands Mobility: closing Bandit's Secret with Double Face frees both hands (+8%). */
export function chrolloFreeHandsFactor(fighter: ArcadeFighter): number {
  if (fighter.id !== 'chrollo' || !fighter.chrolloBook) return 1
  return fighter.chrolloBook.open ? 1 : CHROLLO_CLOSED_BOOK_FACTOR
}

/** Feitan Quick Feint Brake: opens Dash Brake at frame 4 instead of 6. */
export function dashBrakeMinFrame(fighter: ArcadeFighter, defaultFrame: number): number {
  return fighter.id === 'feitan' ? FEITAN_DASH_BRAKE_FRAME : defaultFrame
}

/** Zetsu Stealth Walk: an opponent in Zetsu delays AI reaction when the observer lacks En. */
export function zetsuStealthDelay(observer: ArcadeFighter, target: ArcadeFighter): number {
  return target.nen.mode === 'zetsu' && observer.nen.en === null ? ZETSU_STEALTH_DELAY : 0
}

/**
 * Machi Thread Pull-In: pulls Machi (or a valid borrower) rapidly along an already-attached
 * Nen thread toward the marked opponent, with real collisions and no invulnerability.
 */
export function performMachiThreadPull(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  const target = state[otherSide(side)]
  if (!canThreadPull(actor, target, side)) return state
  const direction: -1 | 1 = target.x >= actor.x ? 1 : -1
  const motion = actor.motion ?? {
    velocityX: 0,
    prejumpFrames: 0,
    jumpDirection: 0 as const,
    landingFrames: 0,
    dash: null,
    heldDirection: 0 as const,
    tapDirection: 0 as const,
    tapWindow: 0,
  }
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - MACHI_THREAD_PULL_COST,
      blocking: false,
      motion: { ...motion, dash: { direction, frame: 0, ...MACHI_THREAD_PULL_DASH } },
    },
  }
}

function canThreadPull(
  actor: ArcadeFighter,
  target: ArcadeFighter,
  side: FightSide,
): boolean {
  if (!machiSourceActive(actor) || !canMove(actor) || actor.y > 0) return false
  if (actor.aura < MACHI_THREAD_PULL_COST || actor.motion?.dash) return false
  if (target.machiThread?.owner !== side) return false
  return Math.abs(target.x - actor.x) > MACHI_THREAD_PULL_MIN_GAP
}

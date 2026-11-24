import { styleMobility } from './styleMobility'
import type { ArcadeFighter, FightInput, FighterDash } from './types'

export const BACKDASH_BRAKE_MIN_FRAME = 9
export const AURA_PUSHBLOCK_WINDOW = 4
export const AURA_PUSHBLOCK_COST = 4
export const AURA_PUSHBLOCK_DISTANCE = 2.5
export const TECH_LANDING_ROLL_FRAMES = 6
export const THROW_TECH_NEUTRAL_DIST = 2
export const THROW_TECH_BACK_DIST = 3.2
export const THROW_TECH_FORWARD_DIST = 1
export const FRANKLIN_BRACED_KNOCKBACK = 0.8

const MIN_X = 7
const MAX_X = 93

/** Backdash Brake: pressing Down in the final beat of a backdash lets you crouch-guard early. */
export function shouldBrakeBackdash(
  fighter: ArcadeFighter,
  dash: FighterDash,
  input: FightInput,
): boolean {
  return (
    dash.direction !== fighter.facing &&
    dash.frame >= BACKDASH_BRAKE_MIN_FRAME &&
    input.down
  )
}

/**
 * Hanzo Shinobi Reverse Step: right after braking a dash, pressing the opposite direction
 * lets Hanzo snap directly into a reverse dash for crisp ninja feints.
 */
export function hanzoReverseDash(
  fighter: ArcadeFighter,
  brakedDirection: -1 | 1,
  direction: -1 | 0 | 1,
): FighterDash | null {
  if (fighter.id !== 'hanzo' || direction === 0 || direction !== -brakedDirection) return null
  const mobility = styleMobility(fighter)
  const profile = direction === fighter.facing ? mobility.forwardDash : mobility.backDash
  return { direction, frame: 0, ...profile }
}

/**
 * Aura Pushblock: guarding on impact within 4 frames while pressing Forward in Ren/Ken
 * spends 4 aura to push the attacker back an extra 2.5 units.
 */
export function applyAuraPushblock(options: {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  blocked: boolean
}): { attacker: ArcadeFighter; defender: ArcadeFighter } {
  const { attacker, defender, blocked } = options
  if (!canAuraPushblock(defender, blocked)) return { attacker, defender }
  const pushDir = attacker.x <= defender.x ? -1 : 1
  return {
    attacker: {
      ...attacker,
      x: Math.max(MIN_X, Math.min(MAX_X, attacker.x + pushDir * AURA_PUSHBLOCK_DISTANCE)),
    },
    defender: { ...defender, aura: defender.aura - AURA_PUSHBLOCK_COST },
  }
}

function canAuraPushblock(defender: ArcadeFighter, blocked: boolean): boolean {
  if (!blocked || defender.guardFrames === 0 || defender.guardFrames > AURA_PUSHBLOCK_WINDOW) {
    return false
  }
  const hasAura = (defender.nen.ken || defender.nen.mode === 'ren') && defender.aura >= AURA_PUSHBLOCK_COST
  return hasAura && (defender.motion?.heldDirection ?? 0) === defender.facing
}

/**
 * Tech Landing Roll: holding Left or Right when touching down after an Air Recovery
 * replaces the 3-frame landing stop with a short 6-frame roll.
 */
export function resolveTechLandingRoll(
  fighter: ArcadeFighter,
  input: FightInput,
  justLanded: boolean,
): Partial<ArcadeFighter> {
  if (!justLanded || !fighter.airRecovery || input.down) return {}
  const direction = (Number(input.right) - Number(input.left)) as -1 | 0 | 1
  if (direction === 0) return {}
  return {
    ukemiRoll: { direction, frames: TECH_LANDING_ROLL_FRAMES },
    ...(fighter.motion ? { motion: { ...fighter.motion, landingFrames: 0 } } : {}),
  }
}

/** Throw-Tech Spacing: holding Back widens separation; holding Forward stays closer. */
export function throwTechSeparation(fighter: ArcadeFighter): number {
  const held = fighter.motion?.heldDirection ?? 0
  if (held === -fighter.facing) return THROW_TECH_BACK_DIST
  if (held === fighter.facing) return THROW_TECH_FORWARD_DIST
  return THROW_TECH_NEUTRAL_DIST
}

/** Franklin Braced Stance: reduces guarded projectile knockback by 20% while braced/crouching. */
export function franklinProjectileGuardFactor(
  defender: ArcadeFighter,
  blocked: boolean,
  melee?: boolean,
): number {
  if (!blocked || melee || defender.id !== 'franklin') return 1
  return defender.crouching || defender.attack !== null ? FRANKLIN_BRACED_KNOCKBACK : 1
}

/** Tserriednich Divergence Sway: halves Back Sway cooldown during Parallel Future divergence. */
export function swayCooldownFor(fighter: ArcadeFighter, baseCooldown: number): number {
  return fighter.id === 'tserriednich' && fighter.futureDiverging
    ? Math.round(baseCooldown / 2)
    : baseCooldown
}

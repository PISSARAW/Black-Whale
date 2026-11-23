import { shuGuardFactor } from './nenCombat/protection'
import { cinematicThrowKnockdown } from './superThrow'
import { fightCategoryEfficiency } from './nenCategories'
import { attackData, attackPhase } from './frameData'
import { hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { nenAttackFactor, nenDamageFactor, releaseFocusedAura } from './nen'
import type { ProjectileHit } from './projectiles'
import { fighterDefinition } from './roster'
import { groundedComboStun } from './groundedComboStun'
import { DIRECTIONAL_LAUNCH_SPEED } from './directionalChain'
import { rememberBodyHit } from './bodyMemory'
import { updateTextureOnHit } from './textureSurpriseMask'
import { thetaBulletDamageFactor } from './martialSpecialists'
import {
  LEORIO_TEN_CHIP_FACTOR,
  LEORIO_TEN_LAUNCH_VY,
  LEORIO_TEN_LAUNCH_Y,
  leorioBreaksTenGuard,
  leorioSurgicalStack,
} from './leorioMedical'
import { furykovResistanceFactor } from './furykovProfile'
import { bashoFireAttackFactor, bashoIgnoresTenGuard, bashoKenCostFactor } from './bashoHaiku'
import {
  FIREARM_BODY_MEMORY_WEIGHT,
  REN_PRESSURE_BLOCKSTUN,
  firearmGuardFactor,
} from './nenPillars'
import type { ArcadeFighter, AttackKind, FightNenZone } from './types'
import { pinnedKnockback, pinnedKnockdown } from './groundedPin'

const GROUND = 0
const MIN_X = 7
const MAX_X = 93

export interface ImpactDefence {
  fighter: ArcadeFighter
  blocked: boolean
  parried: boolean
  avoided: boolean
  invulnerable: boolean
}

interface ResolvedDamageOptions {
  /** Ordinary handgun rounds do not inherit the shooter’s Nen/Hatsu power. */
  physicalProjectile?: boolean
  projectileNenPower?: number
  projectileHatsuPower?: number
  attacker: ArcadeFighter
  defence: ImpactDefence
  base: number
  zone: FightNenZone
  kind: AttackKind
  damageScale: number
  openingMultiplier: number
}

export function resolvedDamage(options: ResolvedDamageOptions): number {
  if (options.base === 0) return 0
  if (options.defence.parried || options.defence.avoided) return 0
  return attackDamage({
    ...options,
    defender: options.defence.fighter,
    blocked: options.defence.blocked,
  })
}

function attackDamage(
  options: Omit<ResolvedDamageOptions, 'defence'> & {
    defender: ArcadeFighter
    blocked: boolean
  },
): number {
  const { attacker, defender, base, blocked, zone, kind, damageScale, openingMultiplier } = options
  const guardBypassed = blocked && bashoIgnoresTenGuard(attacker, defender)
  const leorioChip = leorioBreaksTenGuard(attacker, defender, blocked)
  const guard = options.physicalProjectile
    ? firearmGuardFactor(defender, blocked)
    : !blocked || guardBypassed
      ? 1
      : leorioChip
        ? 0.28 * LEORIO_TEN_CHIP_FACTOR
        : 0.28
  const rawDamage = Math.round(
    base *
      (options.physicalProjectile ? 1 : fighterDefinition(attacker.id).power) *
      (options.projectileNenPower ??
        (options.physicalProjectile ? 1 : nenAttackFactor(attacker, kind))) *
      nenDamageFactor(defender, zone) *
      (options.projectileHatsuPower ??
        (options.physicalProjectile ? 1 : hatsuDamageFactor(attacker))) *
      hatsuDefenceFactor(defender) *
      guard *
      shuGuardFactor(defender, blocked && !guardBypassed, options.physicalProjectile) *
      thetaBulletDamageFactor(attacker, options.physicalProjectile) *
      furykovResistanceFactor(defender, attacker) *
      bashoFireAttackFactor(attacker) *
      openingMultiplier,
  )
  // Scale the rounded wound down so successive light hits cannot round back up.
  const damage = Math.floor(rawDamage * damageScale)
  if (options.physicalProjectile && blocked && (defender.nen.ken || defender.nen.ko)) return 0
  // Ken absorbs ordinary guarded blows, but its protection has finite output.
  const absorption =
    blocked && defender.nen.ken ? 4 + 5 * fightCategoryEfficiency(defender, 'enhancer') : 0
  return absorption ? Math.max(0, damage - Math.round(absorption)) : Math.max(1, damage)
}

interface StrikeOptions {
  zone?: FightNenZone
  melee?: boolean
  fighter: ArcadeFighter
  attacker: ArcadeFighter
  damage: number
  blocked: boolean
  knockdown: boolean
  antiAir: boolean
  wallSplat: boolean
  counterHit: boolean
  comboHits: number
}

export function strikeDefender(options: StrikeOptions): ArcadeFighter {
  const data = attackData(options.attacker.attack?.kind ?? 'light', options.attacker)
  // Frame data supplies timing/force; the resolved wound already includes defence and scaling.
  return struckFighter({ ...data, ...options, melee: true })
}

export function strikeProjectileDefender(
  options: StrikeOptions & { projectile: ProjectileHit['projectile'] },
): ArcadeFighter {
  return struckFighter({
    ...options,
    knockback: options.projectile.knockback,
    hitstun: options.projectile.hitstun,
    blockstun: options.projectile.blockstun,
  })
}

function struckFighter(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): ArcadeFighter {
  const direction = options.fighter.x > options.attacker.x ? 1 : -1
  const textureUpdate = updateTextureOnHit({
    fighter: options.fighter,
    attacker: options.attacker,
    damage: options.damage,
    blocked: options.blocked,
    zone: options.zone,
    kind: options.attacker.attack?.kind,
    variant: options.attacker.attack?.variant,
  })
  const struck = {
    ...options.fighter,
    ...launchState(options),
    airRecovery: airRecoveryOnHit(options),
    ...stunState(options),
    ...comboState(options),
    x: clamp(
      options.fighter.x + direction * pinnedKnockback(options, options.knockback),
      MIN_X,
      MAX_X,
    ),
    health: Math.max(0, options.fighter.health - options.damage),
    aura:
      options.blocked && options.fighter.nen.ken
        ? Math.max(
            0,
            options.fighter.aura -
              (2 + options.damage * 0.1) * bashoKenCostFactor(options.fighter),
          )
        : options.fighter.aura,
    nen: contactNen(options.fighter, options.blocked),
    textureSurprise: textureUpdate.textureSurprise,
    ...(textureUpdate.trapped ? { hitStun: 0, blockStun: 0 } : {}),
    ...(leorioBreaksTenGuard(options.attacker, options.fighter, options.blocked)
      ? { y: Math.max(options.fighter.y, LEORIO_TEN_LAUNCH_Y), velocityY: LEORIO_TEN_LAUNCH_VY }
      : {}),
    ...(!options.blocked &&
    options.damage > 0 &&
    options.attacker.bashoHaikuBuff?.theme === 'fire' &&
    options.attacker.bashoHaikuBuff.quality === 'masterpiece'
      ? { haikuBurn: true }
      : {}),
    easterEgg: undefined,
    easterEggSequence: 0,
    melodyPerformance: undefined,
    knockdownFrames: knockdownFrames(options),
    wakeupInvulnerableFrames: 0,
    attack: null,
    bufferedAttack: null,
    throwTechFrames: 0,
    throwTechRecoveryFrames: 0,
  }
  const firearmHit = Boolean(!options.melee && options.zone && !options.blocked && options.damage > 0)
  const stacks = leorioSurgicalStack(options.attacker, options.fighter)
  let updated = rememberBodyHit(struck, options.zone, options.damage, options.blocked)
  if (stacks > 1) updated = rememberBodyHit(updated, options.zone, options.damage, options.blocked)
  if (firearmHit && (options.zone === 'hands' || options.zone === 'feet')) {
    const prev = options.fighter.bodyMemory?.hits[options.zone] ?? 0
    const nextHits = Math.min(3, prev + FIREARM_BODY_MEMORY_WEIGHT)
    updated = { ...updated, bodyMemory: { hits: { ...updated.bodyMemory?.hits, [options.zone]: nextHits } } }
  }
  return updated
}

function airRecoveryOnHit(options: StrikeOptions): true | undefined {
  if (options.knockdown) return
  if (options.fighter.airRecovery && options.fighter.y > 0) return true
  const directionallyLaunched = options.melee && options.attacker.attack?.directionalChain === 'air'
  return directionallyLaunched && options.antiAir && !options.blocked ? true : undefined
}

function contactNen(fighter: ArcadeFighter, blocked: boolean): ArcadeFighter['nen'] {
  const nen = blocked ? fighter.nen : releaseFocusedAura(fighter).nen
  return { ...nen, en: null, in: false }
}

function launchState(options: StrikeOptions): Pick<ArcadeFighter, 'y' | 'velocityY'> {
  if (!options.antiAir || options.blocked) {
    return { y: options.fighter.y, velocityY: options.fighter.velocityY }
  }
  return {
    y: Math.max(0.2, options.fighter.y),
    velocityY: Math.max(
      options.attacker.attack?.directionalChain === 'air' ? DIRECTIONAL_LAUNCH_SPEED : 18,
      options.fighter.velocityY,
    ),
  }
}

function stunState(
  options: StrikeOptions & { hitstun: number; blockstun: number },
): Pick<ArcadeFighter, 'hitStun' | 'blockStun' | 'pose' | 'blocking'> {
  const hitStun = options.hitstun + Number(options.counterHit) * 3 + Number(options.wallSplat) * 5
  const renPressure =
    options.blocked &&
    options.attacker.nen.mode === 'ren' &&
    !options.fighter.nen.ken &&
    !options.fighter.nen.ko
      ? REN_PRESSURE_BLOCKSTUN
      : 0
  return {
    hitStun: options.blocked ? 0 : contactHitstun(options, hitStun),
    blockStun: options.blocked ? options.blockstun + Number(options.wallSplat) * 3 + renPressure : 0,
    pose: options.blocked ? 'guard' : 'hit',
    blocking: options.blocked,
  }
}

function contactHitstun(options: StrikeOptions, hitstun: number): number {
  if (!options.melee) return hitstun
  return groundedComboStun({
    attacker: options.attacker,
    defender: options.fighter,
    hitstun,
    comboHits: options.comboHits,
  })
}

function comboState(
  options: StrikeOptions,
): Pick<ArcadeFighter, 'comboHits' | 'comboDamage' | 'juggleCount'> {
  const juggled = options.antiAir || options.fighter.y > GROUND
  if (options.blocked) {
    return {
      comboHits: options.fighter.comboHits,
      comboDamage: options.fighter.comboDamage,
      juggleCount: options.fighter.juggleCount,
    }
  }
  return {
    comboHits: options.comboHits,
    comboDamage: options.fighter.comboDamage + options.damage,
    juggleCount: juggled ? options.fighter.juggleCount + 1 : options.fighter.juggleCount,
  }
}

function knockdownFrames(options: StrikeOptions & { hitstun: number }): number {
  if (!options.knockdown || options.blocked) return pinnedKnockdown(options, options.hitstun)
  return Math.max(options.fighter.knockdownFrames, cinematicThrowKnockdown(options.attacker))
}

export function openingType(
  defender: ArcadeFighter,
  blocked: boolean,
): { counterHit: boolean; punish: boolean } {
  if (blocked || !defender.attack) return { counterHit: false, punish: false }
  const phase = attackPhase(defender)
  return {
    counterHit: phase === 'startup' || phase === 'active',
    punish: phase === 'recovery',
  }
}

export function openingDamageMultiplier(opening: { counterHit: boolean; punish: boolean }): number {
  if (opening.counterHit) return 1.1
  if (opening.punish) return 1.15
  return 1
}

export function nextComboHits(defender: ArcadeFighter, defence: ImpactDefence): number {
  if (defence.blocked || defence.avoided) return 0
  const continuing =
    defender.machiThread?.kind === 'bind' ||
    defender.hitStun > 0 ||
    defender.knockdownFrames > 0 ||
    defender.y > GROUND ||
    defender.juggleCount > 0
  return continuing ? Math.max(1, defender.comboHits + 1) : 1
}

export function comboScale(comboHits: number): number {
  return comboHits <= 1 ? 1 : Math.max(0.4, 1 - (comboHits - 1) * 0.1)
}

export function atWall(
  defender: ArcadeFighter,
  attacker: ArcadeFighter,
  knockback: number,
): boolean {
  const direction = defender.x > attacker.x ? 1 : -1
  const destination = defender.x + direction * knockback
  return destination <= MIN_X || destination >= MAX_X
}

/**
 * Grounded pushback the defender could not absorb before the wall: the remaining distance
 * is transferred to the attacker, as in Street Fighter, so a grounded combo cannot loop in
 * the corner once hitstun no longer decays.
 */
export function cornerPushbackTransfer(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  knockback: number,
): ArcadeFighter {
  const direction = defender.x > attacker.x ? 1 : -1
  const landing = defender.x + direction * knockback
  const wall = direction > 0 ? MAX_X : MIN_X
  const missing = direction > 0 ? Math.max(0, landing - wall) : Math.max(0, wall - landing)
  if (missing <= 0) return attacker
  // The refused pushback goes to the attacker, pushed away from the defender: against a right
  // wall the attacker retreats to the left, against a left wall it advances to the right.
  const x = direction > 0 ? attacker.x - missing : attacker.x + missing
  return { ...attacker, x: clamp(x, MIN_X, MAX_X) }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

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
import { followUpLaunchVelocity } from './moveFollowUpPhysics'
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
import { franklinKenDrain } from './troupeUpgrades'
import { hanzoDoubleIgnoresTenPhysical } from './shizukuHanzoKallutoUpgrades'
import { applyJupiterAcousticImpact, isHalkenburgUnblockableArrow } from './halkenburgBonolenovUpgrades'
import { rihanTacticalDefenceFactor } from './matchupValves'
import {
  PADAILLE_DRILL_TEN_CHIP,
  padailleAxeOpensWound,
  padailleDrillBodyMemoryStack,
  padailleDrillPiercesTen,
  padailleHammerKenDrain,
} from './finalFiveUpgrades'
import type { ArcadeFighter, AttackKind, FightNenZone } from './types'
import { comboRestraintHeld } from './comboRestraintHold'
import { pinnedKnockback, pinnedKnockdown } from './groundedPin'
import { guardKnockbackFactor } from './characterMovementTech'
import { franklinProjectileGuardFactor } from './defensiveMovementTech'

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
  if (options.defence.fighter.crossGameStasis) return 0
  if (hanzoDoubleIgnoresTenPhysical(options.attacker, options.defence.fighter)) return 0
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
  const halkenburgPierce = isHalkenburgUnblockableArrow(attacker)
  const guardBypassed = blocked && (bashoIgnoresTenGuard(attacker, defender) || halkenburgPierce)
  const leorioChip = leorioBreaksTenGuard(attacker, defender, blocked)
  const padailleDrill = padailleDrillPiercesTen(attacker, defender, blocked)
  const guard = resolveDamageGuard({
    defender,
    physicalProjectile: options.physicalProjectile,
    blocked,
    guardBypassed,
    leorioChip,
    padailleDrill,
  })
  const wound = resolveWound({
    attacker,
    defender,
    base,
    blocked,
    zone,
    kind,
    damageScale,
    openingMultiplier,
    physicalProjectile: options.physicalProjectile,
    projectileNenPower: options.projectileNenPower,
    projectileHatsuPower: options.projectileHatsuPower,
    guard,
    guardBypassed,
    halkenburgPierce,
  })
  const damage = Math.floor(wound * damageScale)
  if (options.physicalProjectile && blocked && (defender.nen.ken || defender.nen.ko)) return 0
  const absorption = resolveKenAbsorption(defender, blocked, halkenburgPierce)
  return absorption ? Math.max(0, damage - Math.round(absorption)) : Math.max(1, damage)
}

interface WoundContext {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  base: number
  blocked: boolean
  zone: FightNenZone
  kind: AttackKind
  damageScale: number
  openingMultiplier: number
  physicalProjectile?: boolean
  projectileNenPower?: number
  projectileHatsuPower?: number
  guard: number
  guardBypassed: boolean
  halkenburgPierce: boolean
}

function resolveWound(context: WoundContext): number {
  const rawDamage = Math.round(
    context.base *
      (context.physicalProjectile ? 1 : fighterDefinition(context.attacker.id).power) *
      (context.projectileNenPower ??
        (context.physicalProjectile ? 1 : nenAttackFactor(context.attacker, context.kind))) *
      nenDamageFactor(context.defender, context.zone) *
      (context.projectileHatsuPower ??
        (context.physicalProjectile ? 1 : hatsuDamageFactor(context.attacker))) *
      hatsuDefenceFactor(context.defender) *
      context.guard *
      shuGuardFactor(context.defender, context.blocked && !context.guardBypassed, context.physicalProjectile) *
      thetaBulletDamageFactor(context.attacker, context.physicalProjectile) *
      furykovResistanceFactor(context.defender, context.attacker) *
      rihanTacticalDefenceFactor(context.defender) *
      bashoFireAttackFactor(context.attacker) *
      context.openingMultiplier,
  )
  return rawDamage
}

interface DamageContext {
  defender: ArcadeFighter
  physicalProjectile?: boolean
  blocked: boolean
  guardBypassed: boolean
  leorioChip: boolean
  padailleDrill: boolean
}

function resolveDamageGuard(context: DamageContext): number {
  const { defender, physicalProjectile, blocked, guardBypassed, leorioChip, padailleDrill } = context
  if (physicalProjectile) return firearmGuardFactor(defender, blocked)
  if (!blocked || guardBypassed) return 1
  if (leorioChip) return 0.28 * LEORIO_TEN_CHIP_FACTOR
  if (padailleDrill) return 0.28 * PADAILLE_DRILL_TEN_CHIP
  return 0.28
}

function resolveKenAbsorption(
  defender: ArcadeFighter,
  blocked: boolean,
  halkenburgPierce: boolean,
): number {
  if (!blocked || halkenburgPierce || !defender.nen.ken) return 0
  return 4 + 5 * fightCategoryEfficiency(defender, 'enhancer')
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
  const struck = struckFighter({
    ...options,
    knockback: options.projectile.knockback,
    hitstun: options.projectile.hitstun,
    blockstun: options.projectile.blockstun,
  })
  if (options.projectile.jupiter || options.projectile.fighterId === 'bonolenov') {
    return applyJupiterAcousticImpact(struck, Boolean(options.fighter.coveringEars))
  }
  return struck
}

function struckFighter(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): ArcadeFighter {
  const textureUpdate = updateTextureOnHit({
    fighter: options.fighter,
    attacker: options.attacker,
    damage: options.damage,
    blocked: options.blocked,
    zone: options.zone,
    kind: options.attacker.attack?.kind,
    variant: options.attacker.attack?.variant,
  })
  const launch = launchState(options)
  const recovery = airRecoveryOnHit(options)
  const stun = stunState(options)
  const combo = comboState(options)
  const aura = struckAura(options)
  const openWound = openWoundState(options)
  const leorio = leorioLaunchState(options)
  const burn = bashoBurnState(options)
  const next: ArcadeFighter = {
    ...options.fighter,
    ...launch,
    airRecovery: recovery,
    ...stun,
    ...combo,
    x: knockbackPosition(options),
    health: Math.max(0, options.fighter.health - options.damage),
    aura,
    ...openWound,
    nen: contactNen(options.fighter, options.blocked),
    textureSurprise: textureUpdate.textureSurprise,
    ...(textureUpdate.trapped ? { hitStun: 0, blockStun: 0 } : {}),
    ...leorio,
    ...burn,
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
  return applyBodyMemory(options, next)
}

function applyBodyMemory(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
  next: ArcadeFighter,
): ArcadeFighter {
  let updated = rememberBodyHit(next, options.zone, options.damage, options.blocked)
  const stacks = Math.max(
    leorioSurgicalStack(options.attacker, options.fighter),
    padailleDrillBodyMemoryStack(options.attacker),
  )
  if (stacks > 1) updated = rememberBodyHit(updated, options.zone, options.damage, options.blocked)
  if (firearmBodyMemoryApplies(options)) return firearmBodyMemoryUpdate(updated, options)
  return updated
}

function firearmBodyMemoryApplies(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): boolean {
  return Boolean(!options.melee && options.zone && !options.blocked && options.damage > 0)
}

function firearmBodyMemoryUpdate(
  updated: ArcadeFighter,
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): ArcadeFighter {
  if (options.zone !== 'hands' && options.zone !== 'feet') return updated
  const prev = options.fighter.bodyMemory?.hits[options.zone] ?? 0
  const nextHits = Math.min(3, prev + FIREARM_BODY_MEMORY_WEIGHT)
  return { ...updated, bodyMemory: { hits: { ...updated.bodyMemory?.hits, [options.zone]: nextHits } } }
}

function knockbackPosition(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): number {
  const direction = options.fighter.x > options.attacker.x ? 1 : -1
  return clamp(
    options.fighter.x +
      direction *
        pinnedKnockback(options, options.knockback) *
        guardKnockbackFactor(options.fighter, options.blocked) *
        franklinProjectileGuardFactor(options.fighter, options.blocked, options.melee),
    MIN_X,
    MAX_X,
  )
}

function struckAura(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): number {
  const { fighter, attacker, blocked, damage } = options
  if (!(blocked && fighter.nen.ken)) return fighter.aura
  return Math.max(
    0,
    fighter.aura -
      ((2 + damage * 0.1) * bashoKenCostFactor(fighter) + franklinKenDrain(attacker, fighter, blocked) + padailleHammerKenDrain(attacker, fighter, blocked)),
  )
}

function openWoundState(
  options: StrikeOptions & { knockback: number; hitstun: number; blockstun: number },
): { openWounds?: number } {
  const { attacker, blocked, damage, fighter } = options
  return padailleAxeOpensWound(attacker, blocked, damage) ? { openWounds: (fighter.openWounds ?? 0) + 1 } : {}
}

function leorioLaunchState(
  options: StrikeOptions,
): { y?: number; velocityY?: number } {
  if (!leorioBreaksTenGuard(options.attacker, options.fighter, options.blocked)) return {}
  return { y: Math.max(options.fighter.y, LEORIO_TEN_LAUNCH_Y), velocityY: LEORIO_TEN_LAUNCH_VY }
}

function bashoBurnState(options: StrikeOptions): { haikuBurn?: boolean } {
  const buff = options.attacker.bashoHaikuBuff
  if (options.blocked || options.damage <= 0) return {}
  if (buff?.theme !== 'fire' || buff.quality !== 'masterpiece') return {}
  return { haikuBurn: true }
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
  const followUpVelocity = followUpLaunchVelocity(options.attacker)
  const targetVelocity =
    followUpVelocity ??
    (options.attacker.attack?.directionalChain === 'air' ? DIRECTIONAL_LAUNCH_SPEED : 18)
  return {
    y: Math.max(0.2, options.fighter.y),
    velocityY: Math.max(targetVelocity, options.fighter.velocityY),
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
    comboRestraintHeld(defender) ||
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

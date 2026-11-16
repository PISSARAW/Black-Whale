import { fightCategoryEfficiency } from './nenCategories'
import { attackData, attackPhase } from './frameData'
import { hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { nenAttackFactor, nenDamageFactor, releaseFocusedAura } from './nen'
import type { ProjectileHit } from './projectiles'
import { fighterDefinition } from './roster'
import type { ArcadeFighter, AttackKind, FightNenZone } from './types'

const GROUND = 0
const MIN_X = 7
const MAX_X = 93
const THROW_KNOCKDOWN_FRAMES = 48

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
  const guard = blocked ? 0.28 : 1
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
      openingMultiplier,
  )
  // Scale the rounded wound down so successive light hits cannot round back up.
  const damage = Math.floor(rawDamage * damageScale)
  // Ken absorbs ordinary guarded blows, but its protection has finite output.
  const absorption =
    blocked && defender.nen.ken ? 4 + 5 * fightCategoryEfficiency(defender, 'enhancer') : 0
  return absorption ? Math.max(0, damage - Math.round(absorption)) : Math.max(1, damage)
}

interface StrikeOptions {
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
  return struckFighter({ ...data, ...options })
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
  return {
    ...options.fighter,
    ...launchState(options),
    ...stunState(options),
    ...comboState(options),
    x: clamp(options.fighter.x + direction * options.knockback, MIN_X, MAX_X),
    health: Math.max(0, options.fighter.health - options.damage),
    aura:
      options.blocked && options.fighter.nen.ken
        ? Math.max(0, options.fighter.aura - 2 - options.damage * 0.1)
        : options.fighter.aura,
    nen: contactNen(options.fighter, options.blocked),
    // Contact exposes the cloth disguise; it supplies no armour or evasion.
    textureSurprise: undefined,
    melodyPerformance: undefined,
    knockdownFrames: knockdownFrames(options),
    wakeupInvulnerableFrames: 0,
    attack: null,
    bufferedAttack: null,
  }
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
    velocityY: Math.max(18, options.fighter.velocityY),
  }
}

function stunState(
  options: StrikeOptions & { hitstun: number; blockstun: number },
): Pick<ArcadeFighter, 'hitStun' | 'blockStun' | 'pose' | 'blocking'> {
  const hitStun = options.hitstun + Number(options.counterHit) * 3 + Number(options.wallSplat) * 5
  return {
    hitStun: options.blocked ? 0 : hitStun,
    blockStun: options.blocked ? options.blockstun + Number(options.wallSplat) * 3 : 0,
    pose: options.blocked ? 'guard' : 'hit',
    blocking: options.blocked,
  }
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

function knockdownFrames(options: StrikeOptions): number {
  if (!options.knockdown || options.blocked) return options.fighter.knockdownFrames
  return Math.max(options.fighter.knockdownFrames, THROW_KNOCKDOWN_FRAMES)
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

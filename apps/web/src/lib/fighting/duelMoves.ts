import { preparedNenDestinations } from './nenPreparedBranches'
import { guardForVariant, type GuardRequirement } from './combatProperties'
import { nenFollowupReadiness } from './nenComboReadiness'
import { openingAllows } from './comboOpenings'
import type { FighterMove } from './movesetTypes'
import type { AttackFrameData } from './frameData'
import { moveById } from './movesets'
import type { ArcadeFighter, AttackKind, AttackVariant, FighterId } from './types'

type CancelMove = `${AttackVariant}:${AttackKind}`
type CancelTable = Partial<Record<CancelMove, readonly AttackKind[]>>

const UNIVERSAL_CANCELS: CancelTable = {
  'standing:light': ['heavy'],
  'low:light': ['heavy'],
  'air:light': ['heavy'],
  'standing:heavy': ['special'],
  'low:heavy': ['special'],
  'air:heavy': ['special'],
}

/** Character-owned exceptions. Missing entries inherit that character's universal routes. */
export const CHARACTER_CANCELS: Partial<Record<FighterId, CancelTable>> = {
  kurapika: {
    'standing:light': ['heavy', 'special'],
    'standing:heavy': ['special', 'ranged'],
  },
  hisoka: {
    'standing:light': ['heavy', 'special'],
    'air:heavy': ['special', 'ranged'],
  },
  chrollo: {
    'standing:heavy': ['special', 'ranged'],
  },
  biscuit: {
    'standing:light': ['heavy'],
    'low:light': ['heavy', 'special'],
  },
  feitan: {
    'air:light': ['heavy', 'special'],
    'air:heavy': ['special'],
  },
}

export function selectedVariant(fighter: ArcadeFighter): AttackVariant {
  if (fighter.y > 0) return 'air'
  return fighter.crouching ? 'low' : 'standing'
}

export function variantData(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  data: AttackFrameData
}): AttackFrameData {
  const { fighter, kind } = options
  const data = legacyVariantData(options)
  if (moveById(fighter.attack?.moveId)) return data
  const variant = fighter.attack?.variant
  if (variant === 'throw')
    return {
      ...data,
      startup: 7,
      active: 2,
      recovery: 25,
      damage: 14,
      hitstun: 30,
      knockback: 7,
      lunge: 0,
      cancelEnd: 0,
      box: { left: 0, right: 6, bottom: 0, top: 10 },
    }
  if (kind !== 'light' && kind !== 'heavy') return data
  if (variant === 'low')
    return {
      ...data,
      targetZone: 'feet',
      auraZone: 'feet',
      damage: data.damage * 0.85,
      box: { ...data.box, bottom: 0, top: 4.5 },
    }
  if (variant === 'air')
    return { ...data, targetZone: 'head', box: { ...data.box, bottom: -5, top: 5 } }
  if (kind === 'heavy') {
    return {
      ...data,
      targetZone: 'head',
      box: { ...data.box, bottom: 2.4, top: Math.max(15, data.box.top) },
    }
  }
  return data
}

export function canCancel(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  const attack = fighter.attack
  if (!attack || attack.variant === 'throw') return false
  const currentMove = moveById(attack.moveId)
  if (currentMove)
    return Boolean(
      moveId &&
      nenDestinationReady(fighter, moveId) &&
      (preparedNenDestinations(fighter).includes(moveId) ||
        openingAllows(fighter, moveId) ||
        confirmedRoutes(fighter, currentMove).includes(moveId)),
    )
  return legacyCancel(fighter, kind)
}

function confirmedRoutes(fighter: ArcadeFighter, move: FighterMove): readonly string[] {
  if (fighter.attack?.confirmedHit) return move.cancelInto
  return fighter.attack?.confirmedBlock ? move.cancelOnBlockInto : []
}

function legacyCancel(fighter: ArcadeFighter, kind: AttackKind): boolean {
  const attack = fighter.attack!
  if (!attack.confirmedHit) return false
  const move = `${attack.variant ?? 'standing'}:${attack.kind}` as CancelMove
  const routes = CHARACTER_CANCELS[fighter.id]?.[move] ?? UNIVERSAL_CANCELS[move]
  return Boolean(routes?.includes(kind))
}

export function cancelRoutes(
  fighterId: FighterId,
  kind: AttackKind,
  variant: AttackVariant = 'standing',
): readonly AttackKind[] {
  const move = `${variant}:${kind}` as CancelMove
  return CHARACTER_CANCELS[fighterId]?.[move] ?? UNIVERSAL_CANCELS[move] ?? []
}

export function blocksAttack(defender: ArcadeFighter, attacker: ArcadeFighter): boolean {
  const move = moveById(attacker.attack?.moveId)
  return blocksGuardRequirement(defender, move?.guard ?? guardForVariant(attacker.attack?.variant))
}

export function blocksGuardRequirement(defender: ArcadeFighter, guard: GuardRequirement): boolean {
  if (!defender.blocking || defender.y > 0 || guard === 'throw') return false
  if (guard === 'low') return Boolean(defender.crouching)
  return guard !== 'overhead' || !defender.crouching
}

function legacyVariantData(options: Parameters<typeof variantData>[0]): AttackFrameData {
  return { ...comboData(options), guard: guardForVariant(options.fighter.attack?.variant) }
}

function comboData(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  data: AttackFrameData
}): AttackFrameData {
  if (moveById(options.fighter.attack?.moveId)) return options.data
  if (!['kurapika', 'hisoka'].includes(options.fighter.id)) return options.data
  if (options.kind === 'light') return { ...options.data, hitstun: 18 }
  if (options.kind === 'heavy') return { ...options.data, hitstun: 24 }
  return options.data
}

export function attackVariant(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  variant?: AttackVariant
}): AttackVariant {
  if (options.variant) return options.variant
  if (options.kind !== 'light' && options.kind !== 'heavy') return 'standing'
  return selectedVariant(options.fighter)
}

function nenDestinationReady(fighter: ArcadeFighter, id: string): boolean {
  const move = moveById(id)
  return Boolean(move && nenFollowupReadiness(fighter, move) === 'ready')
}

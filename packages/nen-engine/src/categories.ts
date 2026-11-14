import type { NenCategory } from '@black-whale/domain'

export type ActiveNenCategory = Exclude<NenCategory, 'unknown'>
export type NenActionModulator = 'power' | 'range' | 'duration' | 'cost'

export interface NenCategoryProfile {
  naturalAffinity: NenCategory
  mastery: Record<ActiveNenCategory, number>
  learnedAbilities: readonly string[]
}

export interface NenActionDefinition {
  id: string
  abilityId: string
  category: ActiveNenCategory
  modulates: NenActionModulator
  baseCost: number
  basePower?: number
  baseRange?: number
  baseDuration?: number
  upkeep?: number
  requiresAura?: boolean
  requiresTargetKinds?: readonly string[]
  requiresPreparation?: string
}

export interface NenActionContext {
  aura: number
  inZetsu: boolean
  distance?: number
  targetKind?: string
  preparations?: readonly string[]
}

export type NenActionBlock =
  | 'ABILITY_NOT_LEARNED'
  | 'ZETSU_HAS_NO_AURA'
  | 'INSUFFICIENT_AURA'
  | 'TARGET_INCOMPATIBLE'
  | 'OUT_OF_RANGE'
  | 'PREPARATION_MISSING'
  | 'MASTERY_REQUIRED'

export interface NenActionResolution {
  accepted: boolean
  reason?: NenActionBlock
  efficiency: number
  cost: number
  power: number
  range: number
  duration: number
  upkeep: number
}

const HEXAGON: readonly ActiveNenCategory[] = [
  'enhancer',
  'transmuter',
  'conjurer',
  'specialist',
  'manipulator',
  'emitter',
]

const DISTANCE_EFFICIENCY = [1, 0.8, 0.6, 0.4] as const

export function categoryProximity(affinity: NenCategory, category: ActiveNenCategory): number {
  if (affinity === 'unknown') return 1
  const from = HEXAGON.indexOf(affinity)
  const to = HEXAGON.indexOf(category)
  const clockwise = Math.abs(from - to)
  const distance = Math.min(clockwise, HEXAGON.length - clockwise)
  return DISTANCE_EFFICIENCY[distance] ?? 0.4
}

export function categoryEfficiency(
  profile: NenCategoryProfile,
  category: ActiveNenCategory,
): number {
  const mastery = Math.max(0, Math.min(100, profile.mastery[category] ?? 0)) / 100
  return categoryProximity(profile.naturalAffinity, category) * mastery
}

const positive = (value: number | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback

export function resolveNenCategoryAction(
  profile: NenCategoryProfile,
  action: NenActionDefinition,
  context: NenActionContext,
): NenActionResolution {
  const efficiency = categoryEfficiency(profile, action.category)
  const baseCost = positive(action.baseCost, 0)
  const result: NenActionResolution = {
    accepted: true,
    efficiency,
    cost:
      action.modulates === 'cost' && efficiency > 0
        ? Math.ceil(baseCost / efficiency)
        : Math.ceil(baseCost),
    power:
      action.modulates === 'power'
        ? positive(action.basePower, 1) * efficiency
        : positive(action.basePower, 1),
    range:
      action.modulates === 'range'
        ? positive(action.baseRange, 0) * efficiency
        : positive(action.baseRange, 0),
    duration:
      action.modulates === 'duration'
        ? positive(action.baseDuration, 0) * efficiency
        : positive(action.baseDuration, 0),
    upkeep: positive(action.upkeep, 0),
  }

  const reject = (reason: NenActionBlock): NenActionResolution => ({
    ...result,
    accepted: false,
    reason,
  })

  if (!profile.learnedAbilities.includes(action.abilityId)) return reject('ABILITY_NOT_LEARNED')
  if (!efficiency) return reject('MASTERY_REQUIRED')
  if ((action.requiresAura ?? true) && context.inZetsu) return reject('ZETSU_HAS_NO_AURA')
  if (
    action.requiresTargetKinds?.length &&
    (!context.targetKind || !action.requiresTargetKinds.includes(context.targetKind))
  )
    return reject('TARGET_INCOMPATIBLE')
  if (action.requiresPreparation && !context.preparations?.includes(action.requiresPreparation))
    return reject('PREPARATION_MISSING')
  if (typeof context.distance === 'number' && context.distance > result.range)
    return reject('OUT_OF_RANGE')
  if (context.aura < result.cost) return reject('INSUFFICIENT_AURA')
  return result
}

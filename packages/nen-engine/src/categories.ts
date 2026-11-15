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

interface Modulation {
  selected: NenActionModulator
  parameter: NenActionModulator
  value: number
  efficiency: number
}

const modulated = ({ selected, parameter, value, efficiency }: Modulation) =>
  selected === parameter ? value * efficiency : value

function resolvedValues(action: NenActionDefinition, efficiency: number): NenActionResolution {
  const baseCost = positive(action.baseCost, 0)
  const cost = action.modulates === 'cost' && efficiency > 0 ? baseCost / efficiency : baseCost
  return {
    accepted: true,
    efficiency,
    cost: Math.ceil(cost),
    power: modulated({
      selected: action.modulates,
      parameter: 'power',
      value: positive(action.basePower, 1),
      efficiency,
    }),
    range: modulated({
      selected: action.modulates,
      parameter: 'range',
      value: positive(action.baseRange, 0),
      efficiency,
    }),
    duration: modulated({
      selected: action.modulates,
      parameter: 'duration',
      value: positive(action.baseDuration, 0),
      efficiency,
    }),
    upkeep: positive(action.upkeep, 0),
  }
}

interface BlockContext {
  profile: NenCategoryProfile
  action: NenActionDefinition
  context: NenActionContext
  result: NenActionResolution
}

function targetBlock({ action, context }: BlockContext): NenActionBlock | undefined {
  if (!action.requiresTargetKinds?.length) return undefined
  if (!context.targetKind || !action.requiresTargetKinds.includes(context.targetKind))
    return 'TARGET_INCOMPATIBLE'
  return undefined
}

function environmentalBlock({ action, context, result }: BlockContext): NenActionBlock | undefined {
  if (action.requiresPreparation && !context.preparations?.includes(action.requiresPreparation))
    return 'PREPARATION_MISSING'
  if (typeof context.distance === 'number' && context.distance > result.range) return 'OUT_OF_RANGE'
  return undefined
}

function blockFor(block: BlockContext): NenActionBlock | undefined {
  const { profile, action, context, result } = block
  if (!profile.learnedAbilities.includes(action.abilityId)) return 'ABILITY_NOT_LEARNED'
  if (!result.efficiency) return 'MASTERY_REQUIRED'
  if ((action.requiresAura ?? true) && context.inZetsu) return 'ZETSU_HAS_NO_AURA'
  const contextualBlock = targetBlock(block) ?? environmentalBlock(block)
  if (contextualBlock) return contextualBlock
  if (context.aura < result.cost) return 'INSUFFICIENT_AURA'
  return undefined
}

export function resolveNenCategoryAction(
  profile: NenCategoryProfile,
  action: NenActionDefinition,
  context: NenActionContext,
): NenActionResolution {
  const efficiency = categoryEfficiency(profile, action.category)
  const result = resolvedValues(action, efficiency)
  const reason = blockFor({ profile, action, context, result })
  return reason ? { ...result, accepted: false, reason } : result
}

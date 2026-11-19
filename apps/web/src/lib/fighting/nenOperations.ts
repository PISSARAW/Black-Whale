import type { ActiveNenCategory } from '@black-whale/nen-engine'
import { abilityCategories, categoryPower } from './nenCategories'
import type { ArcadeFighter } from './types'

export type NenOperation =
  'impact' | 'projection' | 'construction' | 'property' | 'control' | 'healing'
const OPERATION_CATEGORY: Partial<Record<NenOperation, ActiveNenCategory>> = {
  projection: 'emitter',
  construction: 'conjurer',
  property: 'transmuter',
  control: 'manipulator',
  healing: 'enhancer',
}
const IMPACT_ORDER: readonly ActiveNenCategory[] = ['enhancer', 'transmuter', 'emitter', 'conjurer']
const IMPACT_CATEGORY: Readonly<Record<string, ActiveNenCategory>> = {
  'double-machine-gun': 'emitter',
  'leorio-remote-punch': 'enhancer',
}

/** A mechanism uses its own category. It does not multiply every category of its named Hatsu. */
export function nenOperationCategory(ability: string | null, operation: NenOperation) {
  const categories = abilityCategories(ability)
  const selected = OPERATION_CATEGORY[operation]
  if (selected) return categories.includes(selected) ? selected : null
  const impact = ability && IMPACT_CATEGORY[ability]
  if (impact && categories.includes(impact)) return impact
  return IMPACT_ORDER.find((category) => categories.includes(category)) ?? null
}

export function nenOperationPower(
  fighter: ArcadeFighter,
  action: { ability: string | null; operation: NenOperation },
): number {
  const category = nenOperationCategory(action.ability, action.operation)
  return category ? categoryPower(fighter, category) : 1
}

/** Travel tuning belongs to declared Emission, never to ordinary bullets or every conjured object. */
export function nenTransmissionLifetime(
  fighter: ArcadeFighter,
  action: { ability: string | null; lifetime: number },
): number {
  const power = nenOperationPower(fighter, { ability: action.ability, operation: 'projection' })
  return Math.max(1, Math.round(action.lifetime * power))
}

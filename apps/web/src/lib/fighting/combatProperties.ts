import type { AttackVariant } from './types'

/** Guard rules are independent of the body zone used by Ryu and wound calculation. */
export type GuardRequirement = 'mid' | 'low' | 'overhead' | 'throw'

export function guardForVariant(variant?: AttackVariant): GuardRequirement {
  if (variant === 'throw') return 'throw'
  if (variant === 'low') return 'low'
  return variant === 'air' ? 'overhead' : 'mid'
}

export const GUARD_LABELS: Record<GuardRequirement, readonly [string, string]> = {
  mid: ['Garde haute ou basse', 'Standing or crouching guard'],
  low: ['Garde basse', 'Crouching guard'],
  overhead: ['Garde haute', 'Standing guard'],
  throw: ['Déprojection / saut', 'Throw tech / jump'],
}

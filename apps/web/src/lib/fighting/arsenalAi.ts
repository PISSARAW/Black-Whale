import { FIRST_ARSENAL_AI } from './arsenalAiFirst'
import { SECOND_ARSENAL_AI } from './arsenalAiSecond'
import { martialSlots, type ArsenalAiContext, type ArsenalAiPlan } from './arsenalAiTypes'
import type { FighterId, MoveSlot } from './types'
import { prioritiseNenSlots } from './nenDoctrineActions'

/** Each playable fighter has a plan. No new power, equipment or consent is granted here. */
export const ARSENAL_AI: Partial<Record<FighterId, ArsenalAiPlan>> = {
  ...FIRST_ARSENAL_AI,
  ...SECOND_ARSENAL_AI,
}

export function arsenalAttackSlots(context: ArsenalAiContext): readonly MoveSlot[] {
  if (context.state.opponent.y > 0) return martialSlots(context)
  const plan = ARSENAL_AI[context.state.opponent.id]
  return prioritiseNenSlots(context, [
    ...new Set([...(plan?.(context) ?? []), ...martialSlots(context)]),
  ])
}

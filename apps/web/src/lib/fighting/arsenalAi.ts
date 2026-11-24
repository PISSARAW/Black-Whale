import { prioritiseCommitmentPunish } from './nenCommitment'
import { feitanArsenalSlots } from './feitanAi'
import { FIRST_ARSENAL_AI } from './arsenalAiFirst'
import { SECOND_ARSENAL_AI } from './arsenalAiSecond'
import { martialSlots, type ArsenalAiContext, type ArsenalAiPlan } from './arsenalAiTypes'
import type { FighterId, MoveSlot } from './types'
import { prioritiseNenSlots } from './nenDoctrineActions'
import { physicalAttackSlots } from './physicalCombatAi'

/** Each playable fighter has a plan. No new power, equipment or consent is granted here. */
export const ARSENAL_AI: Partial<Record<FighterId, ArsenalAiPlan>> = {
  ...FIRST_ARSENAL_AI,
  ...SECOND_ARSENAL_AI,
}

export function arsenalAttackSlots(context: ArsenalAiContext): readonly MoveSlot[] {
  const physical = physicalAttackSlots(context)
  if (context.state.opponent.y > 0) return physical ?? martialSlots(context)
  const feitan = feitanArsenalSlots(context)
  if (feitan) return prioritiseCommitmentPunish(context, feitan)
  const plan = ARSENAL_AI[context.state.opponent.id]
  const intent = context.state.opponent.nenTactics
  return prioritiseCommitmentPunish(
    context,
    prioritiseNenSlots(context, [
      ...new Set([
        ...(intent?.slots ?? plan?.(context) ?? []),
        ...(physical ?? []),
        ...martialSlots(context),
      ]),
    ]),
  )
}

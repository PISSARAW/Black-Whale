import type { FightState, MoveSlot } from './types'

export interface ArsenalAiContext {
  state: FightState
  roll: number
  /** Distance to the perceived body, never the hidden real body. */
  gap: number
}
export type ArsenalAiPlan = (context: ArsenalAiContext) => readonly MoveSlot[]

/** Ordinary attacks remain alternatives when an ability's real conditions are unavailable. */
export function martialSlots({ state, roll, gap }: ArsenalAiContext): readonly MoveSlot[] {
  if (state.opponent.y > 0) return roll < 0.5 ? ['airLight', 'airHeavy'] : ['airHeavy', 'airLight']
  if (gap > 12) return ['forwardHeavy', 'forwardLight']
  if (roll < 0.2 && gap <= 5) return ['throw', 'standingLight']
  if (roll < 0.3) return ['lowLight', 'lowHeavy', 'standingLight']
  if (roll < 0.4) return ['lowHeavy', 'lowLight', 'standingLight']
  if (roll < 0.6) return ['forwardLight', 'standingLight', 'standingHeavy']
  if (roll < 0.8) return ['standingHeavy', 'forwardHeavy', 'backHeavy']
  return ['backHeavy', 'standingLight', 'forwardHeavy']
}

/** Different executions of the same available technique, with deterministic variation. */
export function varySlots(roll: number, slots: readonly MoveSlot[]): readonly MoveSlot[] {
  const start = Math.max(0, Math.min(slots.length - 1, Math.floor(roll * slots.length)))
  return [...slots.slice(start), ...slots.slice(0, start)]
}

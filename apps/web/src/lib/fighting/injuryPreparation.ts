import type { FightSide } from './types'

export type InjuryPreparation = Partial<Record<FightSide, 'hand-and-lower-leg'>>

export function validInjuryPreparation(
  value: unknown,
  mode: unknown,
): value is InjuryPreparation | undefined {
  if (value === undefined) return true
  if (mode !== 'scenario' || !value || typeof value !== 'object' || Array.isArray(value))
    return false
  return Object.entries(value).every(
    ([side, preset]) =>
      (side === 'player' || side === 'opponent') && preset === 'hand-and-lower-leg',
  )
}

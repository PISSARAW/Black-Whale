import type { FightSide } from './types'

export const INJURY_PRESETS = ['hand-and-lower-leg', 'face-and-neck', 'post-explosion'] as const
export type InjuryPreset = (typeof INJURY_PRESETS)[number]
export type InjuryPreparation = Partial<Record<FightSide, InjuryPreset>>

export function limbInjury(preset?: InjuryPreset): boolean {
  return preset === 'hand-and-lower-leg' || preset === 'post-explosion'
}
export function surfaceInjury(preset?: InjuryPreset): boolean {
  return preset === 'face-and-neck' || preset === 'post-explosion'
}

export function validInjuryPreparation(
  value: unknown,
  mode: unknown,
): value is InjuryPreparation | undefined {
  if (value === undefined) return true
  if (mode !== 'scenario' || !value || typeof value !== 'object' || Array.isArray(value))
    return false
  return Object.entries(value).every(
    ([side, preset]) =>
      (side === 'player' || side === 'opponent') && INJURY_PRESETS.includes(preset as InjuryPreset),
  )
}

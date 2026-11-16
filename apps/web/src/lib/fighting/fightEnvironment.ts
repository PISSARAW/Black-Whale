import { DEFAULT_FIGHT_STAGE, type FightStageId } from './stages'
import type { FightSide } from './types'
import type { FightPreparation } from './preparationTypes'

/** Match scenario, independent of the scoring format and the two fighters. */
export interface FightEnvironment {
  needleStock?: Partial<Record<FightSide, boolean>>
  preparation?: FightPreparation
  stageId: FightStageId
  morenaPresent: boolean
  unlawfulIntruders: Record<FightSide, boolean>
}

export function createFightEnvironment(options: Partial<FightEnvironment> = {}): FightEnvironment {
  return {
    needleStock: options.needleStock ? { ...options.needleStock } : undefined,
    preparation: options.preparation
      ? {
          ...options.preparation,
          resources: [...options.preparation.resources],
          cohorts: [...options.preparation.cohorts],
        }
      : undefined,
    stageId: options.stageId ?? DEFAULT_FIGHT_STAGE,
    morenaPresent: options.morenaPresent ?? false,
    unlawfulIntruders: { player: false, opponent: false, ...options.unlawfulIntruders },
  }
}

export function inMorenasHideout(environment: FightEnvironment): boolean {
  return environment.stageId === 'heilly-hideout' && environment.morenaPresent
}

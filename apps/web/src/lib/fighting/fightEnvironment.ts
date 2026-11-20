import { DEFAULT_FIGHT_STAGE, type FightStageId } from './stages'
import type { FightSide } from './types'
import type { FightPreparation } from './preparationTypes'

/** Match scenario, independent of the scoring format and the two fighters. */
export interface FightEnvironment {
  /** Explicit non-canonical experiment; absent in ordinary manga-rule scenarios. */
  halkenburgRosterVariant?: boolean
  arenaInteractions?: boolean
  needleStock?: Partial<Record<FightSide, boolean>>
  preparation?: FightPreparation
  stageId: FightStageId
  morenaPresent: boolean
  unlawfulIntruders: Record<FightSide, boolean>
}

export function createFightEnvironment(options: Partial<FightEnvironment> = {}): FightEnvironment {
  return {
    ...(options.halkenburgRosterVariant ? { halkenburgRosterVariant: true } : {}),
    arenaInteractions: options.arenaInteractions ?? false,
    needleStock: options.needleStock ? { ...options.needleStock } : undefined,
    preparation: options.preparation
      ? {
          ...options.preparation,
          ...(options.preparation.injuries
            ? { injuries: { ...options.preparation.injuries } }
            : {}),
          resources: [...options.preparation.resources],
          cohorts: [...options.preparation.cohorts],
          ...copyHinrighKit(options.preparation.hinrighKit),
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

function copyHinrighKit(kit: import('./hinrighKit').HinrighKit | undefined) {
  if (!kit) return {}
  return {
    hinrighKit: Object.fromEntries(
      Object.entries(kit).map(([side, items]) => [side, [...(items ?? [])]]),
    ),
  }
}

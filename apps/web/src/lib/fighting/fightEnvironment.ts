import { DEFAULT_FIGHT_STAGE, type FightStageId } from './stages'
import type { FightSide } from './types'
import type { FightPreparation } from './preparationTypes'

/** Match scenario, independent of the scoring format and the two fighters. */
export interface FightEnvironment {
  /** Explicit non-canonical experiment; absent in ordinary manga-rule scenarios. */
  halkenburgRosterVariant?: boolean
  arenaInteractions?: boolean
  /** Door: two real frames of this level chosen per seat before the round. */
  doorFrames?: Partial<Record<FightSide, import('./voconteDoorTypes').DoorFramePick>>
  needleStock?: Partial<Record<FightSide, boolean>>
  preparation?: FightPreparation
  /** Options of the historical Hisoka-Chrollo scenario; only read by its format. */
  deathMatch?: Partial<import('./heavensDeathMatch/scenario').DeathMatchOptions>
  stageId: FightStageId
  morenaPresent: boolean
  unlawfulIntruders: Record<FightSide, boolean>
}

export function createFightEnvironment(options: Partial<FightEnvironment> = {}): FightEnvironment {
  return {
    ...(options.halkenburgRosterVariant ? { halkenburgRosterVariant: true } : {}),
    arenaInteractions: options.arenaInteractions ?? false,
    ...(options.doorFrames ? { doorFrames: { ...options.doorFrames } } : {}),
    needleStock: options.needleStock ? { ...options.needleStock } : undefined,
    preparation: copyPreparation(options.preparation),
    ...(options.deathMatch ? { deathMatch: { ...options.deathMatch } } : {}),
    stageId: options.stageId ?? DEFAULT_FIGHT_STAGE,
    morenaPresent: options.morenaPresent ?? false,
    unlawfulIntruders: { player: false, opponent: false, ...options.unlawfulIntruders },
  }
}

export function inMorenasHideout(environment: FightEnvironment): boolean {
  return environment.stageId === 'heilly-hideout' && environment.morenaPresent
}

function copyPreparation(preparation: FightPreparation | undefined): FightPreparation | undefined {
  if (!preparation) return undefined
  return {
    ...preparation,
    ...(preparation.injuries ? { injuries: { ...preparation.injuries } } : {}),
    resources: [...preparation.resources],
    cohorts: [...preparation.cohorts],
    ...copyHinrighKit(preparation.hinrighKit),
  }
}

function copyHinrighKit(kit: import('./hinrighKit').HinrighKit | undefined) {
  if (!kit) return {}
  return {
    hinrighKit: Object.fromEntries(
      Object.entries(kit).map(([side, items]) => [side, [...(items ?? [])]]),
    ),
  }
}

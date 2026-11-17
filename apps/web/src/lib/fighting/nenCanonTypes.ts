import type { FighterId, MoveSlot } from './types'

/** Project references and duel adaptations; never inferred from a move's name or aura price. */
export interface NenCanonProfile {
  abilities: readonly string[]
  condition: string
  effect: string
  prohibition: string
  adaptation: string
  physicalSlots?: readonly MoveSlot[]
}

export type NenCanonProfiles = Partial<Record<FighterId, NenCanonProfile>>

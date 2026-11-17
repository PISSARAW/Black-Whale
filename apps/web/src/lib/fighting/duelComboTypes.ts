import type { MoveTuning } from './movesetTypes'
import type { MoveSlot } from './types'

export interface ComboMove {
  tuning?: Partial<MoveTuning>
  into: readonly MoveSlot[]
  window?: number
  links?: readonly MoveSlot[]
}
export interface DuelComboProfile {
  moves: Partial<Record<MoveSlot, ComboMove>>
  window: number
  block: MoveSlot
  /** Opt-in tiered cancel grammar (COMBO_GRAMMAR.md); absent profiles keep authored routes. */
  grammar?: CancelGrammar
}

/**
 * Tiered grammar: ground normals keep their `into` chains and also cancel into every
 * special (on hit and block) and every super (on hit only); specials cancel into supers
 * on hit. Supers never cancel. Every Hatsu condition is still checked at execution.
 */
export interface CancelGrammar {
  specials: readonly MoveSlot[]
  supers: readonly MoveSlot[]
}

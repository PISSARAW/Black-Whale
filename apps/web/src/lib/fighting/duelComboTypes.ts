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
  /** Accélération for a derived grammar (duelComboDerivedGrammar.ts); see CancelGrammar.dash. */
  dash?: CancelGrammar['dash']
}

/**
 * Tiered grammar: ground normals keep their `into` chains and also cancel into every
 * special (on hit and block) and every super (on hit only); specials cancel into supers
 * on hit. Supers never cancel. Every Hatsu condition is still checked at execution.
 */
export interface CancelGrammar {
  specials: readonly MoveSlot[]
  supers: readonly MoveSlot[]
  /** Relance: a special also cancels on hit into the specials listed after it (accelCancel.ts). */
  accel?: true
  /** Accélération: moves that cancel on hit into a dash in that direction (dashCancel.ts). */
  dash?: Partial<Record<MoveSlot, 'back' | 'forward'>>
}

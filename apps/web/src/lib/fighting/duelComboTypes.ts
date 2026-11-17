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
}

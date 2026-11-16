import type { FightSide, FighterId } from './types'

export const COMBO_MASTER_MOVE = 'furykov:neutralSpecial'

export interface ComboMasterAlert {
  incoming: boolean
  /** A concealed aura signature is not identified from private engine knowledge. */
  signature: FighterId | null
  /** Confirmed recipients only; a caster or a future victim is not an affected user. */
  affected: readonly FightSide[]
}

export interface ComboMasterState {
  alert: ComboMasterAlert | null
}

import type { StolenChainAbility } from './kurapika'
import type { FightSide } from './types'

export interface DolphinBodyRef {
  owner: FightSide
  member: number
}
export interface DolphinLoan {
  lender: DolphinBodyRef
  held: StolenChainAbility
  /** The recipient shares the lender's actual blackout; no new command while unconscious. */
  blackoutFrames?: number
}
declare module './types' {
  interface ArcadeFighter {
    dolphinLoan?: DolphinLoan
    dolphinLoanChannel?: { emperorTime: boolean }
  }
}
declare module './kurapika' {
  interface KurapikaState {
    dolphinLoans?: readonly DolphinBodyRef[]
  }
}

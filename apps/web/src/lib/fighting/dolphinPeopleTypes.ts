import type { DolphinLoan } from './dolphinLoanTypes'
import type { LittleEyeScreen } from './littleEyeTypes'
import type { FightSide } from './types'

/** Oito is a real scenario person, with no selectable fighter, Nen affinity or personal Hatsu. */
export interface DolphinPerson {
  identity: 'queen-oito'
  control: { side: FightSide }
  nen: 'closed' | 'semi-open'
  loan?: DolphinLoan
  littleEyeScreen?: LittleEyeScreen
}
declare module './preparationTypes' {
  interface PreparedEntity {
    person?: DolphinPerson
  }
}

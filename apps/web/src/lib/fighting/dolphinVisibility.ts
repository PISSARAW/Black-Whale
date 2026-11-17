import type { DolphinLoan } from './dolphinLoanTypes'
import type { FightSide } from './types'

/** The designated recipient and Kurapika see Dolphin; Gyo does not grant it to other minds. */
export function dolphinVisibleTo(
  viewer: FightSide,
  recipient: FightSide,
  loan?: DolphinLoan,
): boolean {
  return viewer === recipient || loan?.lender.owner === viewer
}

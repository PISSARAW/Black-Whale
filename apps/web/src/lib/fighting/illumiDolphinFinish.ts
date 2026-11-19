import { finishBorrowedCorpse } from './illumiCorpseDolphin'
import { borrowedIllumiFaceBusy } from './illumiDisguiseClock'
import { clearIllumiFace } from './illumiDisguise'
import { finishBorrowedNeedleFace } from './illumiNeedleFaceClock'
import type { FightSide, FightState } from './types'

export function finishBorrowedIllumi(state: FightState, side: FightSide): FightState | null {
  const corpse = finishBorrowedCorpse(state, side)
  if (corpse) return corpse
  const needles = finishBorrowedNeedleFace(state, side)
  if (needles) return needles
  return borrowedIllumiFaceBusy(state[side])
    ? { ...state, [side]: clearIllumiFace(state[side]) }
    : null
}

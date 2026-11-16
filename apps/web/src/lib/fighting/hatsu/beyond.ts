import { BEYOND_CURSE } from '../beyondCurse'
import { martialOnlyHatsu, type FighterHatsu } from './contract'

/** Ch. 401/415: a prepared vessel's death triggers the curse, not a strike or Beyond's low HP. */
export const beyondHatsu: FighterHatsu = {
  ...martialOnlyHatsu('beyond'),
  stealableOutsideDuel: BEYOND_CURSE,
}

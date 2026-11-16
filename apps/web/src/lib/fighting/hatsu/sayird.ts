import { LITTLE_EYE } from '../outsideDuelAbility'
import { martialOnlyHatsu, type FighterHatsu } from './contract'

/** Little Eye exists and can be stolen, but no real animal is supplied by this duel. */
export const sayirdHatsu: FighterHatsu = {
  ...martialOnlyHatsu('sayird'),
  stealableOutsideDuel: LITTLE_EYE,
}

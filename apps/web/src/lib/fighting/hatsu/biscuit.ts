import { martialOnlyHatsu, type FighterHatsu } from './contract'
import { advanceCookie } from '../cookie'
import { COOKIE_TREATMENT } from '../outsideDuelAbility'

/** The native body is martial; Cookie is a separate stealable support Hatsu. */
export const biscuitHatsu: FighterHatsu = {
  ...martialOnlyHatsu('biscuit'),
  stealableOutsideDuel: COOKIE_TREATMENT,
  onFrame: (state) => advanceCookie(state),
}

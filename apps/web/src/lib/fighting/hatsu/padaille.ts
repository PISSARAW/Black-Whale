import { advancePadailleWeapon } from '../padailleWeapon'
import { advancePadailleEscapes } from '../padailleEscape'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const padailleHatsu: FighterHatsu = {
  id: 'padaille',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advancePadailleEscapes(advancePadailleWeapon(state)),
}

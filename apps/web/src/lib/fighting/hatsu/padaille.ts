import { advancePadailleWeapon } from '../padailleWeapon'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const padailleHatsu: FighterHatsu = {
  id: 'padaille',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advancePadailleWeapon,
}

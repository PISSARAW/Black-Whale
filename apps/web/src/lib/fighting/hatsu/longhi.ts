import { advanceMoonlightContract } from '../moonlightContract'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const longhiHatsu: FighterHatsu = {
  id: 'longhi',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceMoonlightContract,
}

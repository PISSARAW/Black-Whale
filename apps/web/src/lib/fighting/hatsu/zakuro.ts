import { advanceBloodyMary } from '../bloodyMaryFrame'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const zakuroHatsu: FighterHatsu = {
  id: 'zakuro',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceBloodyMary,
}

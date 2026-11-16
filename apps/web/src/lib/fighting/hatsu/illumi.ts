import { advanceIllumi } from '../illumiFrame'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Needle People requires its physical implantation path and an actual order. */
export const illumiHatsu: FighterHatsu = {
  id: 'illumi',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceIllumi,
}

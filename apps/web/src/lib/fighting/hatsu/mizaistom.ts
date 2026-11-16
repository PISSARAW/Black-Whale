import { advanceCrossGame } from '../crossGame'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Physical contact never imposes restraint: Cross Game first warns through its own action. */
export const mizaistomHatsu: FighterHatsu = {
  id: 'mizaistom',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceCrossGame,
}

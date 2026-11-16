import { advanceBattleCantabile } from '../battleCantabileFrame'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const bonolenovHatsu: FighterHatsu = {
  id: 'bonolenov',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceBattleCantabile,
}

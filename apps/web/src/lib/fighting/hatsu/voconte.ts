import { advanceVoconteDoors } from '../voconteDoors'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const voconteHatsu: FighterHatsu = {
  id: 'voconte',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceVoconteDoors(state),
}

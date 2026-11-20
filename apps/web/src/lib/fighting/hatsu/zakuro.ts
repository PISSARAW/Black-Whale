import { advanceBloodyMary } from '../bloodyMaryFrame'
import { vacuumMaryDrops } from '../bloodyMaryVacuum'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const zakuroHatsu: FighterHatsu = {
  id: 'zakuro',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => vacuumMaryDrops(advanceBloodyMary(state)),
}

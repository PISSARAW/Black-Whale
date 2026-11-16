import { advanceKallutoPaper } from '../kallutoFrames'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const kallutoHatsu: FighterHatsu = {
  id: 'kalluto',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceKallutoPaper,
}

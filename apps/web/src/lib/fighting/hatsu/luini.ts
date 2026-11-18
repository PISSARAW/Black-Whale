import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'
import { advanceLuiniAnchors } from '../luiniSpatial'

export const luiniHatsu: FighterHatsu = {
  id: 'luini',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceLuiniAnchors(state),
}

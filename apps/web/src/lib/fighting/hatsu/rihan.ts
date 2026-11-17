import { advancePredator } from '../predator'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Predator counters a studied manifestation; a hit on its user never suppresses their Nen. */
export const rihanHatsu: FighterHatsu = {
  id: 'rihan',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advancePredator(state),
}

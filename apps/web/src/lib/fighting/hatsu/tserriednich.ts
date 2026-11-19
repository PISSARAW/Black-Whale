import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'
import { advanceFutureField } from '../futureIllusion'
import { advanceTserriednichGuardian } from '../tserriednichGuardian'

/** Laplace Devil is a simulation branch; it never cancels a collision automatically. */
export const tserriednichHatsu: FighterHatsu = {
  id: 'tserriednich',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceTserriednichGuardian(advanceFutureField(state)),
}

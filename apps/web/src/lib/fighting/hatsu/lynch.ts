import { advanceLynchQuestions } from '../lynchInterrogation'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const lynchHatsu: FighterHatsu = {
  id: 'lynch',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceLynchQuestions(state),
}

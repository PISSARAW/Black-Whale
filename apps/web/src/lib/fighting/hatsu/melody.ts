import { advanceMelodyMusic } from '../melodyChannel'
import { melodyMusicIntent } from '../melodyRules'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const melodyHatsu: FighterHatsu = {
  id: 'melody',
  sourceFor: (fighter, moveId) => (melodyMusicIntent(fighter, 'special', moveId) ? 'melody' : null),
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceMelodyMusic(state),
}

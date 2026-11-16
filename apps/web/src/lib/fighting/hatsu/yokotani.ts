import { advanceLsdf, introduceLsdf } from '../lsdf'
import { unchangedImpact, type FighterHatsu } from './contract'

export const yokotaniHatsu: FighterHatsu = {
  id: 'yokotani',
  onTrigger: ({ state, side }) => introduceLsdf(state, side),
  onImpact: unchangedImpact,
  onFrame: advanceLsdf,
}

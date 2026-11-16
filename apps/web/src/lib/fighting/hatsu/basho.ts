import { advanceBashoPoems } from '../bashoFire'
import { unchangedTrigger, unchangedImpact, type FighterHatsu } from './contract'

export const bashoHatsu: FighterHatsu = {
  id: 'basho',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceBashoPoems(state),
}

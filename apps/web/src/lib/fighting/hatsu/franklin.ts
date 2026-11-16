import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const franklinHatsu: FighterHatsu = {
  id: 'franklin',
  onTrigger: unchangedTrigger,
  // Every point of damage comes from a travelling bullet, never a flat impact bonus.
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}

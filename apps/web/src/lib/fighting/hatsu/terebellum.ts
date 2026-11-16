import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Sweet Home resolves at the instant of injury, through the shared impact pipeline. */
export const terebellumHatsu: FighterHatsu = {
  id: 'terebellum',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}

import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** The surface strike is a real delayed hitbox, never bonus damage on a contact hit. */
export const leorioHatsu: FighterHatsu = {
  id: 'leorio',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}

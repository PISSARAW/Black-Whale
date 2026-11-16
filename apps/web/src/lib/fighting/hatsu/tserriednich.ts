import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Laplace Devil is a simulation branch; it never cancels a collision automatically. */
export const tserriednichHatsu: FighterHatsu = {
  id: 'tserriednich',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}

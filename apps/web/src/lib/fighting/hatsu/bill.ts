import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Erigeron is support for a living target, never self-healing or a personal combat boost. */
export const billHatsu: FighterHatsu = {
  id: 'bill',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}

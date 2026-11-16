import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** The arm transformation supplies reach; no poison or other property is confirmed. */
export const gelHatsu: FighterHatsu = {
  id: 'gel',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
